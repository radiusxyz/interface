import { PrimaryButton, SelectTokenButton } from '../UI/Buttons'
import { NumericInput } from '../UI/Inputs'

import {
  Header,
  Aligner,
  ButtonAndBalanceWrapper,
  Cog,
  HeaderTitle,
  MainWrapper,
  SlippageOption,
  SlippageOptions,
  TokenName,
  TokenWrapper,
  TopTokenRow,
  Logo,
  Balance,
  Circle,
  BottomTokenRow,
  ButtonRow,
  InfoMainWrapper,
  InfoRowWrapper,
  Description,
  ValueAndIconWrapper,
  ImpactAmount,
  InfoIcon,
  Divider,
  MinimumAmount,
} from './RightSectionStyles'

import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { MouseEventHandler, useCallback, useEffect, useMemo, useState } from 'react'
import { useParameters } from 'state/parameters/hooks'

import { ApprovalState, useApprovalOptimizedTrade, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import { useERC20PermitFromTrade, UseERC20PermitState } from 'hooks/useERC20Permit'
import { Field } from 'state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { warningSeverity } from 'utils/prices'
import { useCurrency } from 'hooks/Tokens'
import { useContext } from 'react'
import SwapContext from 'store/swap-context'
import TradePrice from '../../../components/swap/TradePrice'

// eslint-disable-next-line import/no-webpack-loader-syntax
import Settings from '../Settings/Settings'
import { useExpertModeManager } from 'state/user/hooks'

export const RightSection = () => {
  const swapCTX = useContext(SwapContext)
  const {
    swapParams,
    updateSwapParams,
    handleSwapParams,
    handleLeftSection,
    isAtokenSelectionActive,
    handleSetIsAtokenSelectionActive,
    isBtokenSelectionActive,
    handleSetIsBtokenSelectionActive,
    leftSection,
    isAtokenSelected,
    isBtokenSelected,
  } = swapCTX

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const [accountWhiteList, setAccountWhiteList] = useState<boolean>(false)

  const { account } = useActiveWeb3React()

  const parameters = useParameters()

  // TODO:
  const backerIntegrity = true

  // swap state
  const { independentField, typedValue, recipient, INPUT, OUTPUT } = useSwapState()

  const inputCurrency = useCurrency(INPUT.currencyId)
  const outputCurrency = useCurrency(OUTPUT.currencyId)

  const {
    trade: { trade },
    allowedSlippage,
    currencyBalances,
    parsedAmount,
  } = useDerivedSwapInfo()

  const minimum = trade?.minimumAmountOut(allowedSlippage).toSignificant(6).toString()

  const parsedAmounts = {
    [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
    [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
  }

  const priceImpact = trade?.priceImpact

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )

  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    }),
    [dependentField, independentField, parsedAmounts, typedValue]
  )

  ///////////////////////////////
  // approve
  ///////////////////////////////
  const approvalOptimizedTrade = useApprovalOptimizedTrade(trade, allowedSlippage)
  const approvalOptimizedTradeString =
    approvalOptimizedTrade instanceof V2Trade
      ? 'V2SwapRouter'
      : approvalOptimizedTrade instanceof V3Trade
      ? 'V3SwapRouter'
      : 'SwapRouter'

  // check whether the user has approved the router on the input token
  const [approvalState, approveCallback] = useApproveCallbackFromTrade(approvalOptimizedTrade, allowedSlippage)
  const transactionDeadline = useTransactionDeadline()
  const {
    state: signatureState,
    signatureData,
    gatherPermitSignature,
  } = useERC20PermitFromTrade(approvalOptimizedTrade, allowedSlippage, transactionDeadline)

  const handleApprove = useCallback(async () => {
    if (signatureState === UseERC20PermitState.NOT_SIGNED && gatherPermitSignature) {
      try {
        await gatherPermitSignature()
      } catch (error) {
        // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
        if (error?.code !== 4001) {
          await approveCallback()
        }
      }
    } else {
      await approveCallback()
    }
  }, [
    signatureState,
    gatherPermitSignature,
    approveCallback,
    approvalOptimizedTradeString,
    approvalOptimizedTrade?.inputAmount?.currency.symbol,
  ])

  ///////////////////////////////
  // Check Account in Whitelist
  ///////////////////////////////

  useEffect(() => {
    if (account) {
      fetch(`${process.env.REACT_APP_360_OPERATOR}/whiteList?walletAddress=` + account)
        .then(async (is) => {
          const val = await is.text()
          if (val === 'false') setAccountWhiteList(false)
          else setAccountWhiteList(true)
        })
        .catch((e) => console.error(e))
    }
  }, [account, swapParams])

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )

  // the callback to execute the swap
  const {} = useSwapCallback(
    approvalOptimizedTrade,
    allowedSlippage,
    backerIntegrity, //backer integrity
    recipient,
    signatureData,
    parameters
  )

  const [isExpertMode] = useExpertModeManager()

  // TODO: price impact dangerous level
  const priceImpactSeverity = useMemo(() => {
    const executionPriceImpact = trade?.priceImpact
    return warningSeverity(
      executionPriceImpact && priceImpact
        ? executionPriceImpact.greaterThan(priceImpact)
          ? executionPriceImpact
          : priceImpact
        : executionPriceImpact ?? priceImpact
    )
  }, [priceImpact, trade])

  const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode

  const handleConfirmDismiss = useCallback(() => {
    handleLeftSection('welcome')
    handleSwapParams({
      start: false,
      timeLockPuzzleData: swapParams.timeLockPuzzleData,
      timeLockPuzzleDone: swapParams.timeLockPuzzleDone,
    })
  }, [onUserInput, swapParams])

  const handleInputSelect = useCallback(
    (inputCurrency: any) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleOutputSelect = useCallback(
    (outputCurrency: any) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection]
  )
  const [showSettings, setShowSettings] = useState(false)
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const handleShowSettings: MouseEventHandler<SVGSVGElement | HTMLImageElement> = () => {
    setShowSettings((prevState) => !prevState)
  }

  const openInputTokenSelect = () => {
    handleSetIsBtokenSelectionActive(false)
    handleSetIsAtokenSelectionActive(true)
  }

  const openOutputTokenSelect = () => {
    handleSetIsAtokenSelectionActive(false)
    handleSetIsBtokenSelectionActive(true)
  }

  useEffect(() => {
    if (trade && leftSection === 'welcome') {
      handleLeftSection('preview')
    }
  }, [trade, leftSection, handleLeftSection])

  useEffect(() => {
    if (isAtokenSelectionActive || isBtokenSelectionActive) {
      handleLeftSection('search-table')
    }
  }, [isAtokenSelectionActive, isBtokenSelectionActive, handleLeftSection])

  return leftSection === 'progress' || leftSection === 'almost-there' ? (
    <></>
  ) : !showSettings ? (
    <MainWrapper>
      <Header>
        <HeaderTitle>Swap</HeaderTitle>
        <Cog onClick={handleShowSettings} />
      </Header>
      <TopTokenRow>
        {isAtokenSelected && (
          <SlippageOptions>
            <SlippageOption>MAX</SlippageOption>
            <SlippageOption>50%</SlippageOption>
            <SlippageOption>Clear</SlippageOption>
          </SlippageOptions>
        )}
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={isAtokenSelected} onClick={openInputTokenSelect}>
              {isAtokenSelected ? (
                <TokenWrapper>
                  <Logo />
                  <TokenName>{inputCurrency?.symbol}</TokenName>
                </TokenWrapper>
              ) : (
                'Select'
              )}
            </SelectTokenButton>
            {isAtokenSelected && <Balance>Balance : 0.00225</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput
            value={formattedAmounts[Field.INPUT]}
            onUserInput={handleTypeInput}
            isSelected={isAtokenSelected}
          />
        </Aligner>
        <Circle />
      </TopTokenRow>
      <BottomTokenRow>
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={isBtokenSelected} onClick={openOutputTokenSelect}>
              {isBtokenSelected ? (
                <TokenWrapper>
                  <Logo />
                  <TokenName>{outputCurrency?.symbol}</TokenName>
                </TokenWrapper>
              ) : (
                'Select'
              )}
            </SelectTokenButton>
            {isBtokenSelected && <Balance>Balance : 0.00225</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput
            value={formattedAmounts[Field.OUTPUT]}
            onUserInput={() => {
              return
            }}
            isSelected={isAtokenSelected}
          />
        </Aligner>
      </BottomTokenRow>
      <ButtonRow>
        {trade && (
          <InfoMainWrapper>
            <InfoRowWrapper>
              <Description>You receive minimum</Description>
              <ValueAndIconWrapper>
                <MinimumAmount> {minimum && minimum + ' ' + trade?.outputAmount.currency.symbol}</MinimumAmount>
                <InfoIcon />
              </ValueAndIconWrapper>
            </InfoRowWrapper>
            <Divider />
            <InfoRowWrapper>
              <Description>Price impact</Description>
              <ValueAndIconWrapper>
                <ImpactAmount priceImpactTooHigh={priceImpactTooHigh ? 1 : 0}>
                  {priceImpact?.toSignificant(3) + ' %' + `${priceImpactTooHigh ? ' (Too High)' : ''}`}
                </ImpactAmount>
                <InfoIcon />
              </ValueAndIconWrapper>
            </InfoRowWrapper>
          </InfoMainWrapper>
        )}
        {!accountWhiteList && (
          <PrimaryButton mrgn="0px 0px 12px 0px" disabled>
            you are not in whitelist
          </PrimaryButton>
        )}
        {accountWhiteList && (
          <PrimaryButton
            mrgn="0px 0px 12px 0px"
            onClick={() => {
              updateSwapParams({ start: true })
            }}
          >
            Swap
          </PrimaryButton>
        )}

        {trade && (
          <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
        )}
      </ButtonRow>
    </MainWrapper>
  ) : (
    <Settings handleShowSettings={handleShowSettings} isSelected={false} />
  )
}

export default RightSection
