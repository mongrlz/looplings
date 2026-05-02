#!/usr/bin/env node
import net from 'node:net';
import readline from 'node:readline';

const HOST = process.env.BLENDER_HOST ?? '127.0.0.1';
const PORT = Number(process.env.BLENDER_PORT ?? '9876');

const tools = [
  {
    name: 'get_scene_info',
    description: 'Inspect the current Blender scene via the Blender Lab MCP bridge.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'get_object_info',
    description: 'Inspect one object in the current Blender scene by name.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Blender object name.' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'execute_blender_code',
    description: 'Run Python code inside Blender. Set a JSON-serializable dict named result.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Python code to execute in Blender.' },
      },
      required: ['code'],
      additionalProperties: false,
    },
  },
];

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function textResult(text) {
  return {
    content: [{ type: 'text', text }],
  };
}

function executeInBlender(code, timeoutMs = 30000) {
  const payload = `${JSON.stringify({ type: 'execute', strict_json: true, code })}\0`;

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: HOST, port: PORT });
    let data = Buffer.alloc(0);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timed out waiting for Blender Lab bridge at ${HOST}:${PORT}`));
    }, timeoutMs);

    socket.on('connect', () => {
      socket.write(payload);
    });

    socket.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
      const end = data.indexOf(0);
      if (end === -1) return;

      clearTimeout(timer);
      socket.end();
      try {
        const response = JSON.parse(data.slice(0, end).toString('utf8'));
        if (response.status === 'error') {
          reject(new Error(response.message || 'Blender returned an error'));
          return;
        }
        resolve(response.result ?? response);
      } catch (error) {
        reject(error);
      }
    });

    socket.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function sceneInfoCode() {
  return `import bpy
objects=[]
for obj in bpy.context.scene.objects:
    item={
        'name': obj.name,
        'type': obj.type,
        'location': [round(v, 4) for v in obj.location],
        'rotation': [round(v, 4) for v in obj.rotation_euler],
        'scale': [round(v, 4) for v in obj.scale],
        'collections': [c.name for c in obj.users_collection],
    }
    if obj.type == 'MESH' and obj.data:
        item.update({
            'mesh': obj.data.name,
            'vertices': len(obj.data.vertices),
            'polygons': len(obj.data.polygons),
            'dimensions': [round(v, 4) for v in obj.dimensions],
            'materials': [slot.material.name if slot.material else None for slot in obj.material_slots],
        })
    objects.append(item)
result={'file': bpy.data.filepath, 'scene': bpy.context.scene.name, 'object_count': len(objects), 'objects': objects}`;
}

function objectInfoCode(name) {
  return `import bpy
name=${JSON.stringify(name)}
obj=bpy.data.objects.get(name)
if obj is None:
    result={'found': False, 'name': name}
else:
    result={
        'found': True,
        'name': obj.name,
        'type': obj.type,
        'location': [round(v, 4) for v in obj.location],
        'rotation': [round(v, 4) for v in obj.rotation_euler],
        'scale': [round(v, 4) for v in obj.scale],
        'collections': [c.name for c in obj.users_collection],
    }
    if obj.type == 'MESH' and obj.data:
        result.update({
            'mesh': obj.data.name,
            'vertices': len(obj.data.vertices),
            'polygons': len(obj.data.polygons),
            'dimensions': [round(v, 4) for v in obj.dimensions],
            'materials': [slot.material.name if slot.material else None for slot in obj.material_slots],
        })`;
}

async function callTool(name, args = {}) {
  if (name === 'get_scene_info') {
    return textResult(JSON.stringify(await executeInBlender(sceneInfoCode()), null, 2));
  }

  if (name === 'get_object_info') {
    return textResult(JSON.stringify(await executeInBlender(objectInfoCode(args.name)), null, 2));
  }

  if (name === 'execute_blender_code') {
    return textResult(JSON.stringify(await executeInBlender(args.code, 120000), null, 2));
  }

  throw new Error(`Unknown tool: ${name}`);
}

async function handle(message) {
  if (!message || typeof message !== 'object' || !message.method) return;

  try {
    if (message.method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: message.params?.protocolVersion ?? '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'blender-lab-mcp', version: '0.1.0' },
        },
      });
      return;
    }

    if (message.method === 'tools/list') {
      send({ jsonrpc: '2.0', id: message.id, result: { tools } });
      return;
    }

    if (message.method === 'tools/call') {
      const result = await callTool(message.params?.name, message.params?.arguments ?? {});
      send({ jsonrpc: '2.0', id: message.id, result });
      return;
    }

    if (message.id !== undefined) {
      send({ jsonrpc: '2.0', id: message.id, result: {} });
    }
  } catch (error) {
    send({
      jsonrpc: '2.0',
      id: message.id,
      error: { code: -32000, message: error instanceof Error ? error.message : String(error) },
    });
  }
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    void handle(JSON.parse(line));
  } catch (error) {
    send({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: error instanceof Error ? error.message : String(error) },
    });
  }
});
