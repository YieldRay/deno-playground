import { fetchEventSource } from "@microsoft/fetch-event-source";
import mitt from "mitt";

export type Events = {
  stdout: Uint8Array;
  stderr: Uint8Array;
  ready: void;
  exit: string;
};
export function createRunEventStream(url: string) {
  return (code: string) => {
    const emitter = mitt<Events>();

    fetchEventSource(url, {
      method: "POST",
      body: code,
      onmessage({ event, data }) {
        if (event === "stdout" || event === "stderr") {
          const buf = decodeBase64(data);
          console.log({ event, buf, text: new TextDecoder().decode(buf) });
          emitter.emit(event, buf);
        } else {
          console.log({ event, text: data });
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          emitter.emit(event, data);
        }
      },
      onerror(e) {
        emitter.emit("stderr", encodeUTF8(String(e)));
        emitter.emit("exit", "Network Error");
        throw e;
      },
    });

    return emitter;
  };
}

export function encodeUTF8(s: string) {
  return new TextEncoder().encode(s);
}

export function decodeBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
}
