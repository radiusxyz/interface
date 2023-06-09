import styled from 'styled-components/macro'
import { NavLink } from 'react-router-dom'

const Wrapper = styled.nav`
  width: 100%;
  display: flex;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #dde0ff;
  align-items: center;
`

const Span360 = styled.span`
  font-family: Manrope;
  font-style: normal;
  font-weight: 800;
  font-size: 24px;
  line-height: 33px;
  letter-spacing: -0.02em;
  color: #2f0093;
  margin-left: 28px;
`

const LinkList = styled.ul`
  display: flex;
  justify-content: space-between;
  flex-shrink: 1;
  gap: 59px;
  list-style: none;
`
const Item = styled.li`
  padding: 21px 0px 20px 0px;
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 19px;
  color: #333333;
  text-decoration: none;
`

const StyledNavLink = styled(NavLink)`
  text-decoration: none;
`

const RightSide = styled.div`
  display: flex;
  flex-grow: 1;
  gap: 47px;
  max-width: 477px;
`

const Chain = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Status = styled.div`
  border-radius: 50%;
  width: 14px;
  height: 14px;
  background: #793aff;
  border: 1px solid #ffffff;
`

const Title = styled.span`
  font-style: normal;
  font-weight: 600;
  font-size: 18px;
  line-height: 21px;
  color: #555555;
`

const Button = styled.button`
  background: #ffffff;
  border: 1px solid #9aa4ff;
  border-radius: 43px;
  width: 100%;
  max-width: 175px;
  padding-top: 12px;
  padding-bottom: 11px;
`

const AppBar = () => {
  return (
    <Wrapper>
      <Span360>360°</Span360>
      <LinkList>
        <StyledNavLink to="/">
          <Item>Swap</Item>
        </StyledNavLink>
        <StyledNavLink to="/about">
          <Item>About</Item>
        </StyledNavLink>
        <StyledNavLink to="/history">
          <Item>History</Item>
        </StyledNavLink>
        <StyledNavLink to="/my-profit">
          <Item>My Profit</Item>
        </StyledNavLink>
      </LinkList>
      <RightSide>
        <Chain>
          <Status />
          <Title>Polygon</Title>
        </Chain>
        <Button>Connect</Button>
      </RightSide>
    </Wrapper>
  )
}

export default AppBar
