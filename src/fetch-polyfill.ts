/**
 * This file is used in tests only. It forces a polyfill of node fetch
 * since the native fetch was not working in Jest.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import fetch, { Blob, Headers, Request, Response } from 'node-fetch';

(globalThis as any).fetch = fetch;
(globalThis as any).Headers = Headers;
(globalThis as any).Request = Request;
(globalThis as any).Response = Response;
