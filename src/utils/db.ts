import Dexie, { IndexableType, Table } from 'dexie'

export enum Status {
  PENDING,
  COMPLETED,
  CANCELED,
  REJECTED,
  REIMBURSE_AVAILABLE,
  REIMBURSED,
}

export function statusToString(_status: Status) {
  switch (_status) {
    case Status.PENDING:
      return 'Pending'
    case Status.COMPLETED:
      return 'Completed'
    case Status.CANCELED:
      return 'Canceled'
    case Status.REJECTED:
      return 'Rejected'
    case Status.REIMBURSE_AVAILABLE:
      return 'Reimburse Available'
    case Status.REIMBURSED:
      return 'Reimbursed'
    default:
      return 'Pending'
  }
}
export function stringToStatus(_status: string) {
  switch (_status) {
    case 'Pending':
      return Status.PENDING
    case 'Completed':
      return Status.COMPLETED
    case 'Canceled':
      return Status.CANCELED
    case 'Rejected':
      return Status.REJECTED
    case 'Reimburse Available':
      return Status.REIMBURSE_AVAILABLE
    case 'Reimbursed':
      return Status.REIMBURSED
    default:
      return 'Pending'
  }
}

export interface swap {
  id?: number
  tx?: TX
  mimcHash?: string
  txHash: string
  from?: TokenAmount
  to?: TokenAmount
  fromResult?: TokenAmount
  toResult?: TokenAmount

  sendDate?: number

  round?: number
  order?: number
  proofHash?: string
  operatorSignature?: { r: string; s: string; v: number }

  reimbursementTxId?: string
  reimbursement?: TokenAmount
  txId?: string
  txDate?: number

  status?: Status
}

export interface swapParam {
  tx?: TX
  mimcHash?: string
  txHash?: string
  from?: TokenAmount
  to?: TokenAmount
  fromResult?: TokenAmount
  toResult?: TokenAmount

  sendDate?: number

  round?: number
  order?: number
  proofHash?: string
  operatorSignature?: { r: string; s: string; v: number }

  reimbursementTxId?: string
  reimbursement?: TokenAmount
  txId?: string
  txDate?: number

  status?: Status
}

export interface TX {
  txOwner: string
  functionSelector: string
  amountIn: string
  amountOut: string
  path: string[]
  to: string
  nonce: number
  availableFrom: number
  deadline: number
}

export interface TokenAmount {
  token: string
  amount: string
  decimal: string
}

export interface ReadyTx {
  id?: number
  tx: TX
  mimcHash: string
  txHash: string
  progressHere: number
  from: TokenAmount
  to: TokenAmount
}

export interface PendingTx {
  id?: number
  readyTxId: number

  sendDate: number

  round: number
  order: number
  proofHash: string
  operatorSignature?: { r: string; s: string; v: number }
  progressHere: number
}

export interface PendingTxParam {
  readyTxId?: number

  sendDate?: number

  round?: number
  order?: number
  proofHash?: string
  operatorSignature?: { r: string; s: string; v: number }
  progressHere?: number
}

export interface TxHistory {
  id?: number
  pendingTxId: number
  reimbursementTxId?: string
  reimbursement?: TokenAmount
  txId: string
  txDate: number
  from: TokenAmount
  to: TokenAmount
  status: Status
}

export interface TxHistoryParam {
  pendingTxId?: number
  txId?: string
  txDate?: number
  from?: TokenAmount
  to?: TokenAmount
  status?: Status
}

export interface PendingTxWithReadyTx extends PendingTx, ReadyTx {}
export interface TxHistoryWithPendingTx extends TxHistory, PendingTx, ReadyTx {}

export class MySubClassedDexie extends Dexie {
  readyTxs!: Table<ReadyTx>
  pendingTxs!: Table<PendingTx>
  txHistory!: Table<TxHistory>
  swap!: Table<swap>

  constructor() {
    super('ThreeSixty')
    this.version(1).stores({
      readyTxs: '++id, txHash, progressHere',
      pendingTxs: '++id, readyTxId, sendDate, txOwner, nonce, round, order, txHash, progressHere',
      txHistory: '++id, pendingTxId, txDate, txId, fromToken, toToken',
      swap: '++id, &txHash, status, txDate',
    })
  }

  /*
  tx?: TX
  mimcHash?: string
  txHash?: string
  from?: TokenAmount
  to?: TokenAmount

  sendDate?: number

  round?: number
  order?: number
  proofHash?: string
  operatorSignature?: { r: string; s: string; v: number }

  reimbursementTxId?: string
  reimbursement?: TokenAmount
  txId?: string
  txDate?: number

  status: Status
  */
  async updateSwap(_where: { field: string; value: any }, _swap: swapParam) {
    // return db.transaction('rw', db.swap, async () => {
    if ((await db.swap.where(_where.field).equals(_where.value).count()) === 0) {
      return undefined
    } else {
      const swapParam: any = {}
      _swap.tx !== undefined && (swapParam['tx'] = _swap.tx)
      _swap.mimcHash !== undefined && (swapParam['mimcHash'] = _swap.mimcHash)
      _swap.from !== undefined && (swapParam['from'] = _swap.from)
      _swap.to !== undefined && (swapParam['to'] = _swap.to)
      _swap.fromResult !== undefined && (swapParam['fromResult'] = _swap.fromResult)
      _swap.toResult !== undefined && (swapParam['toResult'] = _swap.toResult)
      _swap.sendDate !== undefined && (swapParam['sendDate'] = _swap.sendDate)
      _swap.round !== undefined && (swapParam['round'] = _swap.round)
      _swap.order !== undefined && (swapParam['order'] = _swap.order)
      _swap.proofHash !== undefined && (swapParam['proofHash'] = _swap.proofHash)
      _swap.operatorSignature !== undefined && (swapParam['operatorSignature'] = _swap.operatorSignature)
      _swap.txId !== undefined && (swapParam['txId'] = _swap.txId)
      _swap.txDate !== undefined && (swapParam['txDate'] = _swap.txDate)
      _swap.status !== undefined && (swapParam['status'] = _swap.status)

      return await db.swap.where(_where.field).equals(_where.value).modify(swapParam)
    }
    // })
  }

  async setSwap(_swap: swap) {
    // db.transaction('rw', db.swap, async () => {
    const exist = await db.swap.where({ txHash: _swap.txHash }).count()
    if (exist === 0) return await db.swap.add({ ..._swap, txHash: _swap.txHash as string })
    return undefined
    // })
  }

  async getRecentSwap() {
    const txs = await this.swap.orderBy('id').reverse().limit(1)
    const tx = (await txs.toArray())[0]

    if (tx) {
      return tx
    } else {
      return undefined
    }
  }

  async addReadyTx(_readyTx: ReadyTx) {
    const readyTxs = await this.readyTxs.where({ txHash: _readyTx.txHash })
    const readyTxArray = await readyTxs.toArray()
    if (readyTxArray.length === 0) {
      const readyTx = await this.readyTxs.add(_readyTx)
      return readyTx
    } else {
      return readyTxArray[0]
    }
  }

  async addPendingTx(_pendingTx: PendingTx) {
    const pendingTxs = await this.pendingTxs.where({ readyTxId: _pendingTx.readyTxId })
    const pendingTxArray = await pendingTxs.toArray()
    if (pendingTxArray.length === 0) {
      const pendingTx = await this.pendingTxs.add(_pendingTx)
      return pendingTx
    } else {
      return pendingTxArray[0]
    }
  }

  async addTxHistory(_txHistory: TxHistory) {
    const txHistories = await this.txHistory.where({ pendingTxId: _txHistory.pendingTxId })
    const txHistoriesArray = await txHistories.toArray()
    if (txHistoriesArray.length === 0) {
      const txHistory = await this.txHistory.add(_txHistory)
      return txHistory
    } else {
      return txHistoriesArray[0]
    }
  }

  async getRecentTxHistory() {
    const txs = await this.txHistory.orderBy('id').reverse().limit(1)
    const tx = (await txs.toArray())[0]

    const pendingTxs = await this.pendingTxs.orderBy('id').reverse().limit(1)
    const pendingTx = (await pendingTxs.toArray())[0]

    const readyTxs = await this.readyTxs.orderBy('id').reverse().limit(1)
    const readyTx = (await readyTxs.toArray())[0]

    console.log(readyTx, pendingTx, tx)

    if (readyTx && pendingTx && tx && readyTx.id === pendingTx.readyTxId && tx.pendingTxId === pendingTx.id) {
      return tx
    } else {
      return undefined
    }
  }

  async getTxHistoryWithPendingTxById(id: number) {
    const tx = await this.txHistory.where({ id }).first()

    const pendingTx = await this.pendingTxs.get(tx?.pendingTxId as number)

    const readyTx = await this.readyTxs.get(pendingTx?.readyTxId as number)

    return { ...readyTx, ...pendingTx, ...tx } as TxHistoryWithPendingTx
  }

  async getTxHistoryWithPendingTxByKey(key: IndexableType) {
    const tx = await this.txHistory.get(key)

    const pendingTx = await this.pendingTxs.get(tx?.pendingTxId as number)

    const readyTx = await this.readyTxs.get(pendingTx?.readyTxId as number)

    return { ...readyTx, ...pendingTx, ...tx } as TxHistoryWithPendingTx
  }

  async getPendingTxWithReadyTxById(id: number) {
    const pendingTx = await this.pendingTxs.get(id)

    const readyTx = await this.readyTxs.get(pendingTx?.readyTxId as number)

    return { ...readyTx, ...pendingTx } as PendingTxWithReadyTx
  }

  async getPendingTxWithReadyTxByKey(key: IndexableType) {
    const pendingTx = await this.pendingTxs.get(key)

    const readyTx = await this.readyTxs.get(pendingTx?.readyTxId as number)

    return { ...readyTx, ...pendingTx } as PendingTxWithReadyTx
  }

  async pushPendingTx(_where: { field: string; value: any }, _pendingTx: PendingTxParam) {
    console.log('_pendingTx', _where, _pendingTx, {
      readyTxId: _pendingTx.readyTxId ?? 0,
      sendDate: _pendingTx.sendDate ?? Math.floor(Date.now() / 1000),
      round: _pendingTx.round ?? 0,
      order: _pendingTx.order ?? -1,
      proofHash: _pendingTx.proofHash ?? '',
      operatorSignature: _pendingTx.operatorSignature ?? { r: '', s: '', v: 27 },
      progressHere: _pendingTx.progressHere ?? 0,
    })
    if ((await db.pendingTxs.where(_where.field).equals(_where.value).count()) === 0) {
      const pendingTx = {
        readyTxId: _pendingTx.readyTxId ?? 0,
        sendDate: _pendingTx.sendDate ?? Math.floor(Date.now() / 1000),
        round: _pendingTx.round ?? 0,
        order: _pendingTx.order ?? -1,
        proofHash: _pendingTx.proofHash ?? '',
        operatorSignature: _pendingTx.operatorSignature ?? { r: '', s: '', v: 27 },
        progressHere: _pendingTx.progressHere ?? 0,
      }
      const id = await db.pendingTxs.add(pendingTx)

      const after = await db.pendingTxs.get(id)
      console.log('wrote?', after)
      return id
    } else {
      const before = await db.pendingTxs.where(_where.field).equals(_where.value).first()
      console.log('before?', before)

      _pendingTx.readyTxId &&
        (await db.pendingTxs.where(_where.field).equals(_where.value).modify({ readyTxId: _pendingTx.readyTxId }))
      _pendingTx.sendDate &&
        (await db.pendingTxs.where(_where.field).equals(_where.value).modify({ sendDate: _pendingTx.sendDate }))
      _pendingTx.round &&
        (await db.pendingTxs.where(_where.field).equals(_where.value).modify({ round: _pendingTx.round }))
      _pendingTx.order &&
        (await db.pendingTxs.where(_where.field).equals(_where.value).modify({ order: _pendingTx.order }))
      _pendingTx.proofHash &&
        (await db.pendingTxs.where(_where.field).equals(_where.value).modify({ proofHash: _pendingTx.proofHash }))
      _pendingTx.operatorSignature &&
        (await db.pendingTxs
          .where(_where.field)
          .equals(_where.value)
          .modify({ operatorSignature: _pendingTx.operatorSignature }))
      _pendingTx.progressHere &&
        (await db.pendingTxs.where(_where.field).equals(_where.value).modify({ progressHere: _pendingTx.progressHere }))

      const after = await db.pendingTxs.get(before?.id as number)
      console.log('wrote?', after)

      const pendingTx = await db.pendingTxs.where(_where.field).equals(_where.value).first()

      return pendingTx?.id as number as IndexableType
    }
  }
  async pushTxHistory(_where: { field: string; value: any }, _history: TxHistoryParam) {
    console.log('_history', _where, _history, {
      pendingTxId: _history.pendingTxId ?? 0,
      txId: _history.txId ?? '',
      txDate: _history.txDate ?? Math.floor(Date.now() / 1000),
      from: _history.from ?? { token: '', amount: '', decimal: '1' },
      to: _history.to ?? { token: '', amount: '', decimal: '1' },
      status: _history.status ?? Status.PENDING,
    })
    if ((await db.txHistory.where(_where.field).equals(_where.value).count()) === 0) {
      const history = {
        pendingTxId: _history.pendingTxId ?? 0,
        txId: _history.txId ?? '',
        txDate: _history.txDate ?? Math.floor(Date.now() / 1000),
        from: _history.from ?? { token: '', amount: '', decimal: '1' },
        to: _history.to ?? { token: '', amount: '', decimal: '1' },
        status: _history.status ?? Status.PENDING,
      }
      const id = await db.txHistory.add(history)
      const after = await db.txHistory.get(id)
      console.log('wrote?', after)
      return id
    } else {
      const before = await db.txHistory.where(_where.field).equals(_where.value).first()
      console.log('before?', before)

      _history.pendingTxId &&
        (await db.txHistory.where(_where.field).equals(_where.value).modify({ pendingTxId: _history.pendingTxId }))
      _history.txId && (await db.txHistory.where(_where.field).equals(_where.value).modify({ txId: _history.txId }))
      _history.txDate &&
        (await db.txHistory.where(_where.field).equals(_where.value).modify({ txDate: _history.txDate }))
      _history.from && (await db.txHistory.where(_where.field).equals(_where.value).modify({ from: _history.from }))
      _history.to && (await db.txHistory.where(_where.field).equals(_where.value).modify({ to: _history.to }))
      _history.status &&
        (await db.txHistory.where(_where.field).equals(_where.value).modify({ status: _history.status }))

      const after = await db.txHistory.get(before?.id as number)
      console.log('wrote?', after)

      const txHistory = await db.txHistory.where(_where.field).equals(_where.value).first()

      return txHistory?.id as number as IndexableType
    }
  }
}

export const db = new MySubClassedDexie()
