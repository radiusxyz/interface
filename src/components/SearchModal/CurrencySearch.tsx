// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Currency, Token } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { tokenComparator, useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactGA from 'react-ga4'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useAllTokenBalances } from 'state/wallet/hooks'
import styled from 'styled-components/macro'

import {
  useAllTokens,
  useATokens,
  useBTokens,
  useIsUserAddedToken,
  useSearchInactiveTokenLists,
  useToken,
} from '../../hooks/Tokens'
import { CloseIcon, ThemedText } from '../../theme'
import { isAddress } from '../../utils'
import Column from '../Column'
import Row, { RowBetween } from '../Row'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import ImportRow from './ImportRow'
import { PaddedColumn, SearchInput, Separator } from './styleds'

const ContentWrapper = styled(Column)`
  width: 100%;
  flex: 1 1;
  position: relative;
  background-color: #272b3e; /*linear-gradient(180deg, #525e8d 0%, #3c3e64 48.96%, #2b3258 100%);*/
`

const Footer = styled.div`
  width: 100%;
  border-radius: 20px;
  padding: 20px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  background-color: ${({ theme }) => theme.bg1};
  border-top: 1px solid ${({ theme }) => theme.bg2};
`

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency | null) => void
  otherSelectedCurrency?: Currency | null
  aTokenAddress?: string | null
  bTokenAddress?: string | null
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
  showManageView: () => void
  showImportView: () => void
  setImportToken: (token: Token) => void
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  aTokenAddress,
  bTokenAddress,
  onDismiss,
  isOpen,
  showManageView,
  showImportView,
  setImportToken,
}: CurrencySearchProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const [allToken, setAllToken] = useState<{ [address: string]: Token }>({})

  const bTokens = useBTokens(aTokenAddress)
  const aTokens = useATokens(bTokenAddress)
  const allTokens = useAllTokens()

  useEffect(() => {
    if (aTokenAddress) {
      setAllToken(bTokens)
    } else if (bTokenAddress) {
      setAllToken(aTokens)
    } else {
      setAllToken(allTokens)
    }
  }, [aTokenAddress, bTokenAddress, aTokens, bTokens, allTokens])
  // if they input an address, use it
  const isAddressSearch = isAddress(debouncedQuery)

  const searchToken = useToken(debouncedQuery)

  const searchTokenIsAdded = useIsUserAddedToken(searchToken)

  useEffect(() => {
    if (isAddressSearch) {
      ReactGA.event({
        category: 'Currency Select',
        action: 'Search by address',
        label: isAddressSearch,
      })
    }
  }, [isAddressSearch])

  const filteredTokens: Token[] = useMemo(() => {
    return Object.values(allToken).filter(getTokenFilter(debouncedQuery))
  }, [allToken, debouncedQuery])

  const balances = useAllTokenBalances()
  const sortedTokens: Token[] = useMemo(() => {
    return filteredTokens.sort(tokenComparator.bind(null, balances))
  }, [balances, filteredTokens])

  const filteredSortedTokens = useSortTokensByQuery(debouncedQuery, sortedTokens)

  const native = useNativeCurrency()

  const filteredSortedTokensWithETH: Currency[] = useMemo(() => {
    if (!native) return filteredSortedTokens

    const s = debouncedQuery.toLowerCase().trim()
    if (native.symbol?.toLowerCase()?.indexOf(s) !== -1) {
      return native ? [native, ...filteredSortedTokens] : filteredSortedTokens
    }
    return filteredSortedTokens
  }, [debouncedQuery, native, filteredSortedTokens])

  const handleCurrencySelect = useCallback(
    (currency: Currency | null) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback((event) => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
    fixedList.current?.scrollTo(0)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const s = debouncedQuery.toLowerCase().trim()
        if (s === native?.symbol?.toLowerCase()) {
          handleCurrencySelect(native)
        } else if (filteredSortedTokensWithETH.length > 0) {
          if (
            filteredSortedTokensWithETH[0].symbol?.toLowerCase() === debouncedQuery.trim().toLowerCase() ||
            filteredSortedTokensWithETH.length === 1
          ) {
            handleCurrencySelect(filteredSortedTokensWithETH[0])
          }
        }
      }
    },
    [debouncedQuery, native, filteredSortedTokensWithETH, handleCurrencySelect]
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch) ? debouncedQuery : undefined
  )

  return (
    <ContentWrapper>
      <PaddedColumn
        gap="16px"
        style={{
          background: 'linear-gradient(0deg, #7079be33 0%, #636aae33 100%)',
          alignItems: 'center',
          width: '100%',
        }}
        justify="center"
      >
        <RowBetween style={{ width: '100%', display: 'flex', maxWidth: '440px' }} justify="stretch">
          <div style={{ display: 'absolute', textAlign: 'center', width: '100%' }}>
            <Text fontWeight={500} fontSize={20}>
              <Trans>Select a token</Trans>
            </Text>
          </div>
          <div>&nbsp;</div>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <Row style={{ maxWidth: '560px' }} justify="stretch">
          <SearchInput
            type="text"
            id="token-search-input"
            placeholder={t`Search name or paste address`}
            autoComplete="off"
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            onChange={handleInput}
            onKeyDown={handleEnter}
          />
        </Row>
        {showCommonBases && (
          <CommonBases chainId={chainId} onSelect={handleCurrencySelect} selectedCurrency={selectedCurrency} />
        )}
      </PaddedColumn>
      <Separator />
      {searchToken && !searchTokenIsAdded ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
        </Column>
      ) : filteredSortedTokens?.length > 0 || filteredInactiveTokens?.length > 0 ? (
        <div style={{ flex: '1', width: '100%', alignItems: 'start', justifyContent: 'start' }}>
          <AutoSizer disableWidth style={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'start' }}>
            {(height) => (
              <CurrencyList
                height={filteredSortedTokens.length * 80}
                currencies={disableNonToken ? filteredSortedTokens : filteredSortedTokensWithETH}
                otherListTokens={filteredInactiveTokens}
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={otherSelectedCurrency}
                selectedCurrency={selectedCurrency}
                fixedListRef={fixedList}
                showImportView={showImportView}
                setImportToken={setImportToken}
                showCurrencyAmount={showCurrencyAmount}
              />
            )}
          </AutoSizer>
        </div>
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <ThemedText.Main color={theme.text3} textAlign="center" mb="20px">
            <Trans>No results found.</Trans>
          </ThemedText.Main>
        </Column>
      )}
      {/* <Footer>
        <Row justify="center">
          <ButtonText onClick={showManageView} color={theme.primary1} className="list-token-manage-button">
            <RowFixed>
              <IconWrapper size="16px" marginRight="6px" stroke={theme.primaryText1}>
                <Edit />
              </IconWrapper>
              <ThemedText.Main color={theme.primaryText1}>
                <Trans>Manage Token Lists</Trans>
              </ThemedText.Main>
            </RowFixed>
          </ButtonText>
        </Row>
      </Footer> */}
    </ContentWrapper>
  )
}
