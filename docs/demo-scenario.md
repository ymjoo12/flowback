# Demo Scenario

KFIP 신청서 양식의 "프로토타입(웹 데모 URL + 데모 영상)" 항목에 들어갈 데모 흐름입니다. **3분 이내**에 환불·보상·재구매 전 흐름을 보여주는 것이 목표.

## 사전 준비 (1회)

```bash
pnpm install
pnpm setup:wallets          # Testnet 지갑 2개 발급 + 펀딩 → .env에 SEED 복사
pnpm setup:trustline        # 두 지갑에 RLUSD Trust Line 생성
pnpm dev                    # http://localhost:3000
```

## 시연 단계 (영상 기준 ~ 2분 45초)

### 0:00 — 0:20 · 인트로

- 랜딩 페이지 `/` 진입 → 4개 핵심 메트릭 (환불 처리 시간 3~5초 / 수수료 < $0.0001 / K-커머스 / MVP 개발) 강조
- "결제 이후의 가치 흐름을 하나의 월렛으로 연결합니다." 카피 노출

### 0:20 — 0:50 · 주문 생성 (EscrowCreate)

- 셀러 대시보드 `/seller/dashboard` 진입
- "데모 주문 생성" 패널에서 **100 XRP** 입력 후 "EscrowCreate으로 주문 생성" 클릭
- UI에 트랜잭션 해시 + Escrow Sequence 출력
- `testnet.xrpl.org/transactions/<hash>` 새 탭에서 해시 검증

### 0:50 — 1:30 · 부분 환불 (EscrowFinish + Refund)

- `/seller/orders/1` 진입
- "환불 금액 30 XRP" 입력, 사유 `Out of stock — 1 of 3 items refunded`
- "부분 환불 실행" 클릭 → UI에 두 개 트랜잭션 출력 (EscrowFinish + Refund Payment)
- 정산 이력 타임라인이 즉시 갱신 (Lock → Escrow 해제 → 부분 환불)

### 1:30 — 2:10 · RLUSD 보상 지급

- 같은 화면에서 "지급 RLUSD 5", 사유 `Late-shipping compensation`
- "보상 지급" 클릭 → RLUSD Payment 트랜잭션 발행
- 우측 패널에서 셀러 RLUSD 잔액 감소, 구매자 RLUSD 잔액 증가 확인

### 2:10 — 2:45 · 통합 월렛 + 재구매

- `/buyer/wallet` 진입
- 잔액 카드 3개 (XRP / RLUSD / 환불+보상 누적) 강조
- "주문 #1" 카드 클릭 → `/buyer/orders/1` 진입
- 정산 이력에 EscrowCreate / EscrowFinish / Refund / Reward 4단계가 한 타임라인으로 표시
- 각 항목 옆의 ledger explorer 링크가 동일 해시를 가리킴 (외부 검증 가능)

### 2:45 — 끝 · 마무리

- "분리된 PG + 선정산 + 쿠폰 + CRM 4개 시스템 → 단일 월렛 1개"
- "환불 D+2~7 → 3~5초"
- "이 모든 트랜잭션은 testnet.xrpl.org에서 누구나 검증 가능"

## E2E 트랜잭션 1회 자동 실행

영상 촬영 전 또는 검증 용도로:

```bash
pnpm demo:run
```

스크립트가 EscrowCreate / EscrowFinish / Refund Payment / RLUSD Payment 4개 트랜잭션을 순서대로 실행하고, 각 단계의 해시와 잔액 변동을 출력합니다.

## 영상 제출용 가이드

- 길이: **2분 30초 ~ 3분**
- 해상도: 1920×1080, 60fps 권장
- 자막: 한국어, 핵심 수치(3~5초 / < $0.0001 / 4 → 1) 강조
- 형식: YouTube unlisted 링크 + 다이렉트 mp4 백업
