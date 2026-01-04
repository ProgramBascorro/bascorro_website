"use client";

import { useState, useEffect, useCallback } from "react";

interface Message {
  id: number;
  content: string;
  position: number;
}

export function ROSTopicDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);

  const publishMessage = useCallback(() => {
    const newMessage: Message = {
      id: Date.now(),
      content: `Hello #${messageCount}`,
      position: 0,
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessageCount((prev) => prev + 1);
  }, [messageCount]);

  // Animate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) =>
        prev
          .map((msg) => ({
            ...msg,
            position: msg.position + 5,
          }))
          .filter((msg) => {
            if (msg.position >= 100) {
              setReceivedMessages((r) => [...r.slice(-4), msg.content]);
              return false;
            }
            return true;
          })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Auto-publish when enabled
  useEffect(() => {
    if (!isPublishing) return;
    const interval = setInterval(publishMessage, 800);
    return () => clearInterval(interval);
  }, [isPublishing, publishMessage]);

  return (
    <div className="my-6 rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
        Interactive Demo: ROS 2 Topic Communication
      </div>

      {/* Visualization */}
      <div className="relative mb-6 flex items-center justify-between">
        {/* Publisher Node */}
        <div
          className={`flex h-24 w-32 flex-col items-center justify-center rounded-lg border-2 transition-all ${
            isPublishing
              ? "border-green-500 bg-green-50 dark:bg-green-950"
              : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800"
          }`}
        >
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Publisher
          </div>
          <div className="mt-1 font-mono text-sm font-bold">camera_node</div>
          {isPublishing && (
            <div className="mt-1 h-2 w-2 animate-pulse rounded-full bg-green-500" />
          )}
        </div>

        {/* Topic Channel */}
        <div className="relative mx-4 h-12 flex-1">
          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
            <div className="h-1 w-full bg-neutral-300 dark:bg-neutral-700" />
          </div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-neutral-200 px-2 py-0.5 font-mono text-xs dark:bg-neutral-800">
            /camera/image
          </div>

          {/* Animated Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="absolute top-1/2 -translate-y-1/2 rounded bg-blue-500 px-2 py-1 text-xs text-white shadow-lg transition-all"
              style={{ left: `${msg.position}%` }}
            >
              {msg.content}
            </div>
          ))}
        </div>

        {/* Subscriber Node */}
        <div
          className={`flex h-24 w-32 flex-col items-center justify-center rounded-lg border-2 transition-all ${
            receivedMessages.length > 0
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800"
          }`}
        >
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Subscriber
          </div>
          <div className="mt-1 font-mono text-sm font-bold">detector_node</div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={() => setIsPublishing(!isPublishing)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isPublishing
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isPublishing ? "Stop Publishing" : "Start Publishing"}
        </button>
        <button
          onClick={publishMessage}
          disabled={isPublishing}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          Publish Once
        </button>
        <button
          onClick={() => {
            setReceivedMessages([]);
            setMessageCount(0);
          }}
          className="rounded-lg bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300"
        >
          Reset
        </button>
      </div>

      {/* Received Messages */}
      <div className="rounded-lg bg-neutral-900 p-4 font-mono text-sm text-green-400">
        <div className="mb-2 text-neutral-500">
          $ ros2 topic echo /camera/image
        </div>
        {receivedMessages.length === 0 ? (
          <div className="text-neutral-600">Waiting for messages...</div>
        ) : (
          receivedMessages.map((msg, i) => (
            <div key={i} className="text-green-400">
              data: "{msg}"
            </div>
          ))
        )}
      </div>

      {/* Code Example */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200">
          View Code
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-300">
          <code>{`# Publisher
self.publisher = self.create_publisher(
    String, '/camera/image', 10
)
self.publisher.publish(msg)

# Subscriber  
self.subscription = self.create_subscription(
    String, '/camera/image',
    self.callback, 10
)`}</code>
        </pre>
      </details>
    </div>
  );
}
