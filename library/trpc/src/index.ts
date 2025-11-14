import { formatMessage } from '@project/common';

export interface RpcRequest {
  path: string;
}

export interface RpcResponse {
  message: string;
  timestamp: number;
}

export function handleRequest(request: RpcRequest): RpcResponse {
  return {
    message: formatMessage(`trpc:${request.path}`),
    timestamp: Date.now()
  };
}
