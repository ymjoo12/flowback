# 03 · 주요 기능 (5개)

각 기능은 **사용자 관점에서 무엇을 할 수 있게 되는지** 한 줄로 설명합니다. 모든 기능은 XRPL Testnet 위에서 실제 트랜잭션으로 동작합니다.

## 1. EscrowCreate 기반 주문 락업

구매자가 결제한 순간 그 자금은 **XRPL ledger 위 Escrow 객체**에 잠긴다. 셀러는 그 자금을 임의로 가져갈 수 없고, 구매자는 "내 돈이 어디에 있는지"를 ledger explorer에서 직접 검증할 수 있다.

- API: `POST /api/orders` → `EscrowCreate` 서명·제출
- 트랜잭션: [예시 — testnet.xrpl.org](https://testnet.xrpl.org/) (지갑 부팅 후 실제 해시 첨부)

## 2. 부분 환불 (EscrowFinish + Refund Payment)

품절·교환불가 같은 사후 사유가 발생하면, 셀러는 한 번의 액션으로 **셀러 수령액과 구매자 환불액을 동시에** 처리한다. 카드 환불의 D+2~7을 ledger 종결 시간(3~5초)으로 단축한다.

- API: `POST /api/orders/{id}/partial-refund` → `EscrowFinish` + `Payment(refund)`
- 핵심 UX: 셀러 콘솔에서 "환불 금액 30 XRP" 한 칸만 입력하면 두 트랜잭션이 자동 발행됨.

## 3. RLUSD 보상 지급

지연 보상·교환 보상·VIP 리워드를 카드사 외부 결제 없이 **RLUSD(스테이블코인)로 즉시** 지급한다. 구매자 입장에서는 카드 청구서가 아닌 월렛 잔액 형태로 보유하여, 다음 구매에 그대로 사용 가능.

- API: `POST /api/orders/{id}/reward` → RLUSD `Payment`
- 전제: 두 지갑이 RLUSD `TrustSet`을 완료한 상태 (`pnpm setup:trustline`).

## 4. 통합 구매자 월렛

XRP 잔액·RLUSD 잔액·환불 누적·보상 누적·각 주문의 정산 상태를 한 화면에서 본다. 다음 결제 시 잔액이 자동으로 차감되어 "내 환불이 어디서 사라졌지?" 같은 불안이 사라진다.

- URL: `/buyer/wallet`, 주문 상세는 `/buyer/orders/{id}`
- 모든 항목 옆에 ledger explorer 링크가 노출되어 분쟁 시 즉시 검증 가능.

## 5. 셀러 정산 대시보드

락업된 결제·환불 예정액·보상 지급액·재구매 전환율을 단일 운영 화면에서 추적한다. 액션 버튼 한 번으로 부분 환불·보상 지급을 ledger에 기록한다.

- URL: `/seller/dashboard`, 주문 처리는 `/seller/orders/{id}`
- 디자인 의도: 정보 밀도가 높은 콘솔(테이블 + 카드 메트릭 + 액션 패널)이지만, 모든 액션은 한 번의 클릭으로 끝.
