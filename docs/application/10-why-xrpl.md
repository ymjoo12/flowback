# 10 · XRPL을 선택한 이유

> "왜 다른 블록체인이나 전통 DB가 아닌 XRPL인가?"라는 질문에 **기술적 근거 5가지**와 **비즈니스적 근거 3가지**로 답합니다.

## 기술적 근거

### 1. native Escrow 기능 — 별도 스마트컨트랙트 불필요

XRPL은 ledger 자체에 `EscrowCreate`, `EscrowFinish`, `EscrowCancel` 3개 트랜잭션 타입을 내장하고 있다. 정산 자금을 락업·해제·취소하는 기본 워크플로를 별도의 Solidity 컨트랙트 개발·감사 없이 ledger-native primitive로 구현할 수 있다.

```typescript
// src/lib/xrpl/escrow.ts (실제 구현 발췌)
const tx: EscrowCreate = {
  TransactionType: "EscrowCreate",
  Account: buyer.classicAddress,
  Destination: seller.classicAddress,
  Amount: xrpToDrops("100"),
  DestinationTag: orderId,
  FinishAfter: now - 1,    // 셀러는 즉시 정산 가능
  CancelAfter: now + 3600, // 미정산 시 1시간 뒤 구매자 자동 환불
};
```

EVM 기반 escrow DApp이라면 OpenZeppelin Audit 비용($5만~$15만), 코드 감사 시간 4~8주, 가스비 변동성을 모두 끌어안아야 한다. XRPL은 이 비용을 0으로 만든다.

### 2. 평균 트랜잭션 수수료 < $0.0001

소액 환불·보상에 적합. RLUSD 보상 5 USD를 지급할 때 가스비가 본 비용의 일부를 넘기는 EVM 환경과 달리, XRPL에서는 수수료가 본 비용의 0.002% 미만이다.

| 네트워크 | 평균 트랜잭션 수수료 (USD) | 5 USD 환불의 수수료 비율 |
|---------|--------------------------|------------------------|
| Ethereum Mainnet | $0.50 ~ $5.00 | 10~100% |
| Polygon | $0.01 ~ $0.05 | 0.2~1.0% |
| XRPL | < $0.0001 | < 0.002% |

> 출처: 각 네트워크의 2024-2025 평균 가스/수수료 통계.

### 3. 3~5초 컨센서스 종결성

XRPL의 평균 ledger close time은 **3~5초**, 종결 후 즉시 finality. 카드 환불의 D+2~7을 압축할 수 있는 결정적 기준선이다. EVM L2(Optimism, Arbitrum) 또한 ~2초의 confirm을 제공하지만, sequencer 신뢰 가정이 필요하다. XRPL은 validator-set 기반의 native finality.

### 4. IOU·Trust Line 기반 RLUSD 통합

XRPL의 native IOU/Trust Line 모델 위에 **Ripple USD(RLUSD)** 스테이블코인이 직접 발행되어 있다. 보상·리워드 지급을 별도 토큰 컨트랙트 없이 native `Payment` 트랜잭션으로 처리할 수 있다.

- Testnet RLUSD issuer: `rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV`
  ([livenet.xrpl.org/accounts](https://livenet.xrpl.org/accounts/rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV))
- Mainnet RLUSD issuer: `rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`
- 출처: Ripple 공식 문서 — [docs.ripple.com/stablecoin/developer-resources/rlusd-on-the-xrpl](https://docs.ripple.com/stablecoin/developer-resources/rlusd-on-the-xrpl/)

### 5. DestinationTag로 주문 ID 매핑

XRPL의 32-bit `DestinationTag` 필드를 이용해 모든 정산 트랜잭션에 내부 주문 ID를 부착한다. on-chain 트랜잭션과 off-chain 주문이 한 줄의 정수로 묶이며, 분쟁·정산 추적이 단순해진다.

## 비즈니스적 근거

### 1. Ripple의 cross-border 정산 인프라와 연속성

XRPL과 Ripple ODL은 이미 글로벌 송금·정산에서 검증된 인프라다. K-커머스 셀러가 글로벌로 확장할 때 같은 ledger 위에서 송금·결제·정산이 연결되는 미래 시나리오를 그릴 수 있다.

### 2. 한국 시장의 XRP 친숙도

XRP는 한국 가상자산 거래소(업비트·빗썸·코인원)에서 거래량 상위 토큰 중 하나로, 사용자 인지도가 높다. KFIP 같은 프로그램이 XRPL 트랙을 운영하는 것도 같은 맥락. K-커머스 셀러 온보딩 시 "또 다른 신뢰할 수 없는 코인"이라는 진입 장벽이 낮다.

### 3. 컴플라이언스 친화적 토큰 모델

RLUSD는 Ripple이 발행하는 USD-pegged 스테이블코인으로, 뉴욕금융감독청(NYDFS)의 한도 내에서 발행된다. 향후 한국 가상자산법(가칭 「가상자산이용자보호법」) 대응에서 무허가 스테이블코인 대비 우위.

## 전통 DB가 아닌 이유

전통 RDBMS만으로도 환불·보상·리워드를 통합한 데이터 모델을 만들 수는 있다. 하지만 그 경우:

- **신뢰의 주체**: 셀러나 플랫폼이 자체 DB의 정합성을 보장해야 한다. 분쟁 발생 시 외부 검증이 어렵다.
- **글로벌 결제 정합성**: 통화 변환·송금은 별도 PG 채널을 거치므로, "한 화면에서 본다"는 약속이 실제 자금 이동에 닿지 못한다.
- **소비자 신뢰 메시지**: "내 돈은 XRPL Escrow에 잠겨 있다"는 메시지가 "내 돈은 셀러 DB row에 표시되어 있다"보다 강력하다.

## 한 줄 요약 (신청서 양식)

> XRPL의 native Escrow와 Trust Line 기능으로 별도 스마트컨트랙트 개발 없이 정산 락업·스테이블코인 보상 흐름을 구현할 수 있고, 평균 트랜잭션 수수료 < $0.0001과 3~5초 컨센서스 종결성이 소액·다빈도 환불·보상 워크플로에 적합하기 때문이다.
