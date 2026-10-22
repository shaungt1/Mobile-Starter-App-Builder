export type Unsubscribe = () => void;

export interface DeviceTransport<Message> {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: Message): Promise<void>;
  subscribe(listener: (message: Message) => void): Unsubscribe;
}

export class UnsupportedDeviceTransport<Message> implements DeviceTransport<Message> {
  async connect(): Promise<void> {
    throw new Error("Select and install a device transport capability before connecting hardware.");
  }
  async disconnect(): Promise<void> {}
  async send(_message: Message): Promise<void> {
    throw new Error("No device transport is configured.");
  }
  subscribe(_listener: (message: Message) => void): Unsubscribe {
    return () => undefined;
  }
}
