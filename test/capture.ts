// TEST: OUTPUT CAPTURE (also hooks the console, as Bun's console does not go through process.stdout.write)

import {format} from "node:util"

type Stream = NodeJS.WriteStream
type Listener = (text: string) => void

const consoleMethods = {
    stdout: ["log", "info", "debug"],
    stderr: ["error", "warn", "trace"]
}

const restores = new Map<Stream, () => void>()

const streamName = (stream: Stream) => (stream === process.stderr ? "stderr" : "stdout")

export const startCapture = (stream: Stream, listener: Listener) => {
    stopCapture(stream)

    const originalWrite = stream.write
    const originalMethods = consoleMethods[streamName(stream)].map((name) => [name, console[name]])

    stream.write = ((chunk: any) => {
        listener(chunk.toString())
        return true
    }) as any

    for (const [name] of originalMethods) {
        console[name] = (...args: any[]) => listener(format(...args) + "\n")
    }

    restores.set(stream, () => {
        stream.write = originalWrite
        for (const [name, method] of originalMethods) console[name] = method
    })
}

export const stopCapture = (stream: Stream) => {
    restores.get(stream)?.()
    restores.delete(stream)
}

const capture = (stream: Stream, fn: Function): string => {
    let captured = ""

    startCapture(stream, (text) => (captured += text))

    try {
        fn()
    } finally {
        stopCapture(stream)
    }

    return captured
}

export const captureStdout = (fn: Function) => capture(process.stdout, fn)

export const captureStderr = (fn: Function) => capture(process.stderr, fn)
