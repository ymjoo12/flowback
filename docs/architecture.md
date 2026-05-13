# Architecture

FlowBack은 신청서 항목을 충족하는 **최소한의 풀스택 프로토타입**으로 설계되었습니다. 데모의 모든 트랜잭션은 XRPL Testnet 위에서 실제로 발생합니다.

## 기술 스택

| 영역 | 선택 |
|------|------|
| Frontend | Next.js 15 App Router (React 19) |
| Styling | Tailwind CSS v4 (manual shadcn-style components) |
| Backend | Next.js Route Handlers (Node.js runtime) |
| DB | better-sqlite3 (단일 파일, 데모 단계 최적) |
| XRPL | `xrpl` v4 (WebSocket 클라이언트, Testnet `wss://s.altnet.rippletest.net:51233`) |
| 호스팅 | Vercel (Fluid Compute) |

## 데이터 흐름 (Buyer 주문 → Partial Refund → Reward)

```
[Seller Console]
      │ POST /api/orders { totalXrp: "100" }
      ▼
[Next.js Route Handler] ─► [orders.ts::createOrder]
                                    │
                                    │ 1) BUYER wallet signs EscrowCreate
                                    │ 2) submitAndWait → XRPL Testnet
                                    │ 3) record orders + settlements rows
                                    ▼
                       [SQLite (data/flowback.db)]
                                    │
                                    │ Order id = 1, sequence = N
                                    ▼
                          [Order Timeline UI]

[Seller Console] / [Buyer Wallet]
      │ POST /api/orders/1/partial-refund
      ▼
[orders.ts::executePartialRefund]
      │ 1) SELLER wallet signs EscrowFinish (offerSeq = N)
      │ 2) SELLER wallet signs Payment 30 XRP → BUYER  (refund leg)
      │ 3) update order.status = 'partially_refunded'
      ▼
[Order Timeline shows two new entries with tx hashes]

[Seller Console]
      │ POST /api/orders/1/reward { amountRlusd: "5" }
      ▼
[orders.ts::payReward]
      │ 1) SELLER wallet signs Payment(IOU RLUSD 5 → BUYER)
      ▼
[Buyer Wallet RLUSD balance +5; reward entry in timeline]
```

## XRPL Escrow의 두-leg 부분 환불 패턴

XRPL의 단일 Escrow 객체는 **부분 종결을 지원하지 않는다**. `EscrowFinish`는 락업된 전체 금액을 한 번에 destination(=셀러)에게 보낸다.

FlowBack은 이 제약을 **두 단계 처리**로 해결한다.

1. `EscrowFinish` — 셀러에게 100 XRP 전액 입금
2. 같은 트랜잭션 직후, 셀러 지갑이 `Payment` 트랜잭션으로 30 XRP를 buyer에게 환불

UX 관점에서는 셀러가 "환불 30 XRP" 한 칸만 입력하지만, ledger 관점에서는 두 트랜잭션이 차례로 기록되어 정산 이력이 명확하다.

향후 production에서는 **주문 생성 시점에 Escrow 두 개를 만들어 미리 분기**하는 방식(예: 셀러 수령용 70 XRP + 환불 풀 30 XRP)도 고려된다. 이 패턴은 `docs/xrpl-integration.md`에서 자세히 다룬다.

## DB 스키마

```sql
CREATE TABLE orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_address   TEXT    NOT NULL,
  seller_address  TEXT    NOT NULL,
  total_xrp       TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'escrowed',
  escrow_owner    TEXT    NOT NULL,
  escrow_sequence INTEGER,
  escrow_tx_hash  TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE settlements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kind        TEXT    NOT NULL,     -- escrow_create | escrow_finish | refund | reward
  amount      TEXT    NOT NULL,
  currency    TEXT    NOT NULL,     -- XRP | RLUSD
  tx_hash     TEXT    NOT NULL,
  note        TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

## 디렉터리 구조

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 랜딩
│   ├── buyer/wallet/             # 구매자 월렛
│   ├── buyer/orders/[id]/        # 구매자 주문 타임라인
│   ├── seller/dashboard/         # 셀러 대시보드
│   ├── seller/orders/[id]/       # 셀러 주문 처리
│   └── api/                      # Route Handlers
├── components/                   # 공용 UI
└── lib/
    ├── db/                       # SQLite wrapper + queries
    ├── orders.ts                 # 주문/정산 도메인 로직
    └── xrpl/                     # XRPL helpers (Escrow, RLUSD, Wallet)

scripts/
├── setup-wallets.ts              # Testnet 지갑 발급/펀딩
├── setup-rlusd-trustline.ts      # RLUSD Trust Line 생성
└── demo-run.ts                   # E2E 데모 1회 실행
```

## 보안·운영 고려 (PoC 단계 스코프)

- 데모용 SEED는 `.env`에 보관되고 `.gitignore`로 제외됨. 운영 단계에서는 HSM/KMS·MPC 지갑 또는 사용자 보유 지갑(Xaman/Crossmark) 전환 필요.
- API는 인증 미적용. 운영 단계에서는 셀러·구매자 인증(OAuth, MagicLink) 및 RBAC 필요.
- SQLite는 단일 파일 데모 용도. 운영 단계에서는 PostgreSQL + ledger 인덱서(WebSocket subscription)로 교체.
