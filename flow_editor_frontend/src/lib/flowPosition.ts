/**
 * Cálculo de posição de bloco no flow para INSERT/save com posição exata.
 * Garante order_index, next_block_key e route_context para o Rapid Processor.
 */

import type { FlowBlock } from '@/types/flow';
import { CANVAS_TO_DB_TYPE } from '@/types/flowDB';
import type { FlowBlockTypeDB } from '@/types/flowDB';

export type BlockWithKey = FlowBlock & { blockKey?: string };

export interface PositionInsertResult {
  /** order_index para o novo bloco (posição na sequência) */
  order_index: number;
  /** id ou block_key do bloco que vem DEPOIS do novo (novo.nextBlock) */
  nextBlockId: string | null;
  /** id do bloco que vem ANTES (esse bloco deve ter nextBlock atualizado para o novo) */
  previousBlockId: string | null;
  /** Se dentro de rota: first | middle | last (para route_context.route_position) */
  route_position?: 'first' | 'middle' | 'last';
}

/**
 * Blocos na mesma rota (parentRouterId + routeId), na ordem em que aparecem na lista.
 */
export function getBlocosNaRota(
  blocks: BlockWithKey[],
  parentRouterId: string,
  routeId: string
): BlockWithKey[] {
  return blocks.filter(
    (b) => b.parentRouterId === parentRouterId && b.routeId === routeId
  );
}

/**
 * Gera o próximo block_key para um tipo, baseado nos blocos já existentes (canvas).
 * Usado no cliente para que o novo bloco já tenha blockKey ao ser inserido.
 */
export function generateBlockKeyFromCanvas(
  blockType: FlowBlockTypeDB,
  existingBlocks: BlockWithKey[]
): string {
  const prefix = {
    primeira_mensagem: 'PM',
    mensagem: 'MSG',
    caminhos: 'CAM',
    aguardar: 'AG',
    encerrar: 'ENC',
    ferramenta: 'FER',
  }[blockType] || 'BLK';

  const existingNumbers = existingBlocks
    .filter((b) => {
      const key = (b as any).blockKey || b.id;
      return typeof key === 'string' && key.startsWith(prefix);
    })
    .map((b) => {
      const key = ((b as any).blockKey || b.id) as string;
      const match = key.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

  const nextNum =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

/**
 * Calcula a posição do novo bloco ao ser inserido em insertAt.
 * Retorna order_index, nextBlockId, previousBlockId e (se em rota) route_position.
 * O frontend deve: 1) setar novoBloco.order_index, novoBloco.nextBlock; 2) atualizar anterior.nextBlock = novoBloco.id.
 */
export function computeBlockPositionInsert(
  blocks: BlockWithKey[],
  insertAt: number,
  options: {
    parentRouterId?: string | null;
    routeId?: string | null;
  } = {}
): PositionInsertResult {
  const { parentRouterId, routeId } = options;
  const inRoute = Boolean(parentRouterId && routeId);

  if (inRoute) {
    const naRota = getBlocosNaRota(blocks, parentRouterId!, routeId!);
    const indicesNaRota = naRota.map((b) => blocks.indexOf(b));
    const idxInRoute = indicesNaRota.filter((i) => i < insertAt).length;
    const previousInRoute = naRota[idxInRoute - 1] ?? null;
    const nextInRoute = naRota[idxInRoute] ?? null;

    const order_index =
      previousInRoute && nextInRoute
        ? Math.floor(
            ((previousInRoute as { order_index?: number }).order_index ?? 0) +
              ((nextInRoute as { order_index?: number }).order_index ?? 0)
          ) / 2
        : previousInRoute
          ? ((previousInRoute as { order_index?: number }).order_index ?? 0) + 10
          : nextInRoute
            ? Math.max(
                0,
                ((nextInRoute as { order_index?: number }).order_index ?? 10) - 10
              )
            : insertAt * 10;

    let route_position: 'first' | 'middle' | 'last' =
      !previousInRoute ? 'first' : !nextInRoute ? 'last' : 'middle';

    return {
      order_index,
      nextBlockId: nextInRoute
        ? (nextInRoute as any).blockKey || nextInRoute.id
        : null,
      previousBlockId: previousInRoute?.id ?? null,
      route_position,
    };
  }

  const previousBlock = insertAt > 0 ? blocks[insertAt - 1] : null;
  const nextBlock = insertAt < blocks.length ? blocks[insertAt] : null;

  const orderAnterior = (previousBlock as { order_index?: number })?.order_index ?? 0;
  const orderProximo =
    (nextBlock as { order_index?: number })?.order_index ?? orderAnterior + 10;
  const order_index =
    previousBlock && nextBlock
      ? Math.floor((orderAnterior + orderProximo) / 2)
      : previousBlock
        ? orderAnterior + 10
        : nextBlock
          ? Math.max(0, orderProximo - 10)
          : 0;

  return {
    order_index,
    nextBlockId: nextBlock
      ? (nextBlock as any).blockKey || nextBlock.id
      : null,
    previousBlockId: previousBlock?.id ?? null,
  };
}

/**
 * Mapeia tipo do canvas para tipo DB (para generateBlockKeyFromCanvas).
 */
export function canvasTypeToDBType(type: FlowBlock['type']): FlowBlockTypeDB {
  return (CANVAS_TO_DB_TYPE[type] || 'mensagem') as FlowBlockTypeDB;
}
