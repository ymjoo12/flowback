# XRPL Integration Guide

FlowBack이 XRPL을 어떻게 활용하는지 — Escrow, RLUSD Trust Line, 그리고 운영상의 제약을 정리한 문서입니다.

## 네트워크 / 엔드포인트

| 네트워크 | WebSocket | Explorer |
|---------|-----------|----------|
| Testnet | `wss://s.altnet.rippletest.net:51233` | https://testnet.xrpl.org/ |
| Mainnet | `wss://xrplcluster.com` | https://livenet.xrpl.org/ |

환경변수 `XRPL_NETWORK=testnet|mainnet` 으로 전환합니다 (`src/lib/xrpl/network.ts`).

## 지갑 부팅

```bash
pnpm setup:wallets
```

- `client.fundWallet()` 호출로 Testnet 지갑 2개를 발급·펀딩한다.
- 출력된 SEED를 `.env`에 복사: `SELLER_SEED`, `BUYER_SEED` (그리고 편의를 위한 `SELLER_ADDRESS`, `BUYER_ADDRESS`).
- 운영 단계에서는 사용자 보유 지갑(Xaman, Crossmark, GemWallet)으로 전환 — 신청서 데모용으로는 SEED 기반 노드 지갑이 가장 단순.

## EscrowCreate / EscrowFinish / EscrowCancel

```typescript
// EscrowCreate
{
  TransactionType: "EscrowCreate",
  Account: buyer.classicAddress,     // 자금을 잠그는 주체
  Destination: seller.classicAddress, // 잠긴 자금의 수령 후보
  Amount: xrpToDrops("100"),          // XRP 단위 → drops
  DestinationTag: orderId,            // 32-bit 정수, 내부 주문 ID
  FinishAfter: now - 1,               // 셀러가 즉시 EscrowFinish 가능
  CancelAfter: now + 60 * 60,         // 1시간 미정산 시 구매자 자동 환불
}
```

```typescript
// EscrowFinish (셀러 측에서 호출)
{
  TransactionType: "EscrowFinish",
  Account: seller.classicAddress,
  Owner: buyer.classicAddress,        // 원본 EscrowCreate의 Account
  OfferSequence: <원본 Sequence 번호>, // EscrowCreate 응답에서 받음
}
```

```typescript
// EscrowCancel (CancelAfter 이후 구매자 또는 누구나 호출 가능)
{
  TransactionType: "EscrowCancel",
  Account: buyer.classicAddress,
  Owner: buyer.classicAddress,
  OfferSequence: <원본 Sequence 번호>,
}
```

### 운영상 제약

1. **Escrow는 부분 종결 불가**. `EscrowFinish`는 전체 금액을 destination에게 보낸다. → FlowBack은 EscrowFinish 후 별도 Refund Payment로 부분 환불을 구현한다.
2. **Escrow는 XRP만 락업 가능**. IOU(RLUSD 등)는 락업 대상이 아니다. → 보상·리워드는 별도 `Payment(IOU)` 트랜잭션으로 처리한다.
3. **CancelAfter는 FinishAfter보다 늦어야 한다**. 동시 또는 역순 설정 시 트랜잭션이 거부된다.

### 향후 production 패턴 (이 PoC에는 미구현)

주문 생성 시점에 **두 개의 Escrow**를 만들어 미리 분기하는 방식:

- Escrow A: 70 XRP, destination = seller (정상 정산용)
- Escrow B: 30 XRP, destination = seller (refund pool)

품절 발생 시:
- Escrow A → `EscrowFinish`로 셀러 수령
- Escrow B → `EscrowCancel`로 buyer에게 자동 반환 (CancelAfter 이용)

이 방식은 두 트랜잭션을 미리 정해진 시간 흐름으로 분리할 수 있어, 셀러가 자금을 갖고 있어야만 환불할 수 있다는 의존성을 제거한다.

## RLUSD Trust Line + Payment

```bash
pnpm setup:trustline
```

- 두 지갑에 RLUSD `TrustSet` 트랜잭션을 발행하여 RLUSD를 보유할 수 있는 상태로 만든다.
- Testnet RLUSD issuer: `rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV`
  ([livenet.xrpl.org에서 확인](https://livenet.xrpl.org/accounts/rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV))
- Mainnet RLUSD issuer: `rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`
- RLUSD currency code (40-char hex): `524C555344000000000000000000000000000000`
- Testnet RLUSD 자체는 [tryrlusd.com](https://tryrlusd.com/) faucet에서 별도로 받을 수 있다.

```typescript
// RLUSD Payment
{
  TransactionType: "Payment",
  Account: seller.classicAddress,
  Destination: buyer.classicAddress,
  Amount: {
    currency: "524C555344000000000000000000000000000000",
    issuer: "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV",
    value: "5",                  // 5 RLUSD
  },
  DestinationTag: orderId,
}
```

## DestinationTag 매핑 정책

- 모든 정산 관련 트랜잭션의 `DestinationTag`에 **내부 orderId**를 부착한다.
- 분쟁 또는 ledger reconciliation 시, on-chain 트랜잭션만으로 어떤 주문의 어떤 단계인지 식별 가능.
- 32-bit 정수이므로 4억 건까지 안전 (한 셀러 기준 충분).

## 트랜잭션 검증

- Testnet: `https://testnet.xrpl.org/transactions/<hash>`
- Mainnet: `https://livenet.xrpl.org/transactions/<hash>`

UI의 모든 settlements 행 옆에는 해당 explorer 링크가 노출된다. 분쟁 시 공유 가능한 공개 URL.

## 운영시 추가 고려 (PoC 스코프 외)

- **AccountSet RequireDest / DisallowXRP** 플래그로 잘못된 송금 방지
- **TickSize / TransferRate** 으로 RLUSD 송금 시 별도 수수료 부과 (issuer-level)
- **AMM / DEX** 활용한 XRP ↔ RLUSD 자동 환전 (현재는 미구현, 셀러 잔액 직접 차감)
- **WebSocket subscribe**로 ledger 이벤트 실시간 인덱싱 (PoC는 polling 없음)
- **Ledger Reservation** — 각 Escrow가 ~2 XRP의 owner reserve를 잠시 잠근다. 운영 단계에서는 이를 고려한 마진 설계 필요.
