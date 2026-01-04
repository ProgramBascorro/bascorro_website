"use client";

import { useState } from "react";

interface Node {
  id: string;
  name: string;
  type: "publisher" | "subscriber" | "both";
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
  topic: string;
}

const NODES: Node[] = [
  { id: "camera", name: "camera_node", type: "publisher", x: 50, y: 80 },
  { id: "ball", name: "ball_detector", type: "both", x: 250, y: 50 },
  { id: "strategy", name: "strategy_node", type: "both", x: 450, y: 80 },
  { id: "walking", name: "walking_module", type: "subscriber", x: 650, y: 80 },
  { id: "imu", name: "imu_sensor", type: "publisher", x: 250, y: 180 },
];

const CONNECTIONS: Connection[] = [
  { from: "camera", to: "ball", topic: "/camera/image" },
  { from: "ball", to: "strategy", topic: "/ball/position" },
  { from: "strategy", to: "walking", topic: "/cmd_vel" },
  { from: "imu", to: "strategy", topic: "/imu/data" },
];

export function NodeGraph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(
    null
  );

  const getNodeColor = (node: Node, isSelected: boolean) => {
    if (isSelected) return "fill-blue-500";
    switch (node.type) {
      case "publisher":
        return "fill-green-500";
      case "subscriber":
        return "fill-orange-500";
      default:
        return "fill-purple-500";
    }
  };

  const isConnectionHighlighted = (conn: Connection) => {
    if (!selectedNode) return false;
    return conn.from === selectedNode || conn.to === selectedNode;
  };

  return (
    <div className="my-6 rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
        Interactive Demo: ROS 2 Node Graph
      </div>

      <svg
        viewBox="0 0 750 250"
        className="w-full rounded-lg bg-white dark:bg-neutral-800"
      >
        {/* Connections */}
        {CONNECTIONS.map((conn, i) => {
          const fromNode = NODES.find((n) => n.id === conn.from)!;
          const toNode = NODES.find((n) => n.id === conn.to)!;
          const isHighlighted = isConnectionHighlighted(conn);
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2 - 20;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredConnection(conn.topic)}
              onMouseLeave={() => setHoveredConnection(null)}
              className="cursor-pointer"
            >
              {/* Arrow line */}
              <line
                x1={fromNode.x + 40}
                y1={fromNode.y}
                x2={toNode.x - 40}
                y2={toNode.y}
                className={`transition-all ${
                  isHighlighted || hoveredConnection === conn.topic
                    ? "stroke-blue-500"
                    : "stroke-neutral-400 dark:stroke-neutral-600"
                }`}
                strokeWidth={isHighlighted ? 3 : 2}
                markerEnd="url(#arrowhead)"
              />
              {/* Topic label */}
              {(isHighlighted || hoveredConnection === conn.topic) && (
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  className="fill-blue-600 text-xs font-mono dark:fill-blue-400"
                >
                  {conn.topic}
                </text>
              )}
            </g>
          );
        })}

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              className="fill-neutral-400 dark:fill-neutral-600"
            />
          </marker>
        </defs>

        {/* Nodes */}
        {NODES.map((node) => (
          <g
            key={node.id}
            onClick={() =>
              setSelectedNode(selectedNode === node.id ? null : node.id)
            }
            className="cursor-pointer"
          >
            {/* Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={35}
              className={`${getNodeColor(
                node,
                selectedNode === node.id
              )} transition-all ${
                selectedNode === node.id ? "opacity-100" : "opacity-80"
              }`}
            />
            {/* Node name */}
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              className="fill-white text-xs font-medium"
            >
              {node.name.split("_")[0]}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-neutral-600 dark:text-neutral-400">
            Publisher
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-orange-500" />
          <span className="text-neutral-600 dark:text-neutral-400">
            Subscriber
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-purple-500" />
          <span className="text-neutral-600 dark:text-neutral-400">Both</span>
        </div>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="mt-4 rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
          <div className="font-mono text-sm font-medium">
            {NODES.find((n) => n.id === selectedNode)?.name}
          </div>
          <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
            <div>
              Publishes:{" "}
              {CONNECTIONS.filter((c) => c.from === selectedNode)
                .map((c) => c.topic)
                .join(", ") || "None"}
            </div>
            <div>
              Subscribes:{" "}
              {CONNECTIONS.filter((c) => c.to === selectedNode)
                .map((c) => c.topic)
                .join(", ") || "None"}
            </div>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        Click on nodes to see their connections. Hover over lines to see topic
        names.
      </p>
    </div>
  );
}
