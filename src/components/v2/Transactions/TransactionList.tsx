import styled from 'styled-components/macro'
import PendingTransaction from './PendingTransaction'
import CompletedTransaction from './CompletedTransaction'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`
type Props = {
  status: string
  txs: {
    id: string
    hash: string
    status: string
    date: string
    from: string
    to: string
    reimbursed?: boolean
    tx: any
  }[]
}

const TransactionList = ({ txs, status }: Props) => (
  <Wrapper>
    {(status === 'In Progress' && txs.map((tx) => <PendingTransaction key={tx.id} tx={tx} />)) ||
      txs.map((tx) => <CompletedTransaction key={tx.id} tx={tx} />)}
  </Wrapper>
)

export default TransactionList
