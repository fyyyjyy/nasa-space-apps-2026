// Decodes Draco-compressed NASA GLBs to plain GLB so the app's GLTFLoader (no Draco decoder) can read them.
// Usage: node scripts/prepare-models.js <in.glb> <out.glb>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';

const [inp, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});
const doc = await io.read(inp);
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
}
await doc.transform(dedup(), weld(), ...(process.env.SIMPLIFY ? [simplify({ simplifier: MeshoptSimplifier, ratio: Number(process.env.SIMPLIFY), error: 0.01 })] : []), prune(), quantize());
await io.write(out, doc);
let tris = 0;
for (const m of doc.getRoot().listMeshes())
  for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
console.log(out, 'triangles', tris);




