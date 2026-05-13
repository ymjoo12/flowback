# FlowBack

> **Post-purchase Settlement Wallet on XRPL** — 글로벌 커머스 거래 이후 발생하는 환불·보상·리워드·재구매 혜택을 하나의 스테이블코인 월렛으로 연결합니다.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-flowback--theta.vercel.app-2dd4bf)](https://flowback-theta.vercel.app)
[![XRPL Testnet](https://img.shields.io/badge/XRPL-Testnet-5eead4)](https://testnet.xrpl.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](./LICENSE)

> **HYBLOCK** 팀이 Korea Financial Innovation Program 2026 (KFIP 2026) 1차 제출을 위해 개발한 1차 프로덕트입니다.
>
> **Live Demo**: <https://flowback-theta.vercel.app>

---

## 한 줄 정의

**FlowBack은 K-커머스 글로벌 셀러와 해외 구매자**를 위해, 결제 이후 발생하는 부분 환불·반품·보상·재구매 혜택의 분절된 가치 흐름을 **XRPL Escrow와 RLUSD 스테이블코인 월렛**으로 묶어 **D+0 실시간 정산**을 제공하는 **사후 정산 인프라**입니다.

## 핵심 지표

| 지표 | FlowBack | 기존 카드/PG |
|------|----------|-------------|
| 환불 도달 시간 | **3~5초** | 3~7영업일 |
| 처리 수수료 | **< $0.0001 / tx** | 1.0~3.5% |
| 운영 시스템 수 | **1개 월렛** | 4개 (PG·선정산·쿠폰·CRM) |
| 분쟁 검증 | **public ledger explorer** | PG 내부 로그 |

> 상세 비교: [`docs/application/02-value-proposition.md`](./docs/application/02-value-proposition.md)

## 빠른 시작

### 1. 의존성 설치

```bash
pnpm install
```

> Node.js 22+, pnpm 10+가 필요합니다.

### 2. Testnet 지갑 부팅

```bash
pnpm setup:wallets
```

스크립트가 셀러·구매자 두 지갑을 Testnet faucet에서 발급·펀딩한 뒤 SEED 값을 stdout에 출력합니다. 출력된 값을 `.env`에 그대로 복사하세요 (`.env`는 `.gitignore`에 등록됨).

```env
XRPL_NETWORK=testnet
SELLER_SEED=sEd7...
SELLER_ADDRESS=r...
BUYER_SEED=sEd9...
BUYER_ADDRESS=r...
```

### 3. RLUSD Trust Line 생성

```bash
pnpm setup:trustline
```

두 지갑이 Ripple USD (RLUSD)를 보유할 수 있도록 `TrustSet` 트랜잭션을 발행합니다.

> **셀러 보상 시연을 위한 RLUSD 토큰 받기** — `TrustSet`만으로는 잔액이 0입니다. 보상 지급을 시연하려면 [tryrlusd.com](https://tryrlusd.com/) 에서 **SELLER 주소(`.env`의 `SELLER_ADDRESS`)** 로 testnet RLUSD를 받아두세요. (Faucet UI에 셀러 주소를 붙여넣고 "Send"를 누르면 됩니다.)

### 4. 개발 서버 실행

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 에서 4개 화면을 확인:

- `/` — 랜딩 (서비스 소개)
- `/seller/dashboard` — 셀러 정산 대시보드 + 데모 주문 생성
- `/seller/orders/[id]` — 부분 환불·RLUSD 보상 지급
- `/buyer/wallet` — 구매자 통합 월렛
- `/buyer/orders/[id]` — 주문별 정산 타임라인

### 5. E2E 트랜잭션 시연 (선택)

```bash
pnpm demo:run
```

EscrowCreate → EscrowFinish → Refund Payment → RLUSD Payment 4개 트랜잭션을 1회 자동 실행하고, 모든 해시를 `testnet.xrpl.org` 링크로 출력합니다.

---

## 신청서 항목 매트릭스

| 신청서 항목 | 문서 |
|------------|------|
| 한 줄 정의 | [`docs/application/01-elevator-pitch.md`](./docs/application/01-elevator-pitch.md) |
| 핵심 가치 제안 / 차별화 | [`docs/application/02-value-proposition.md`](./docs/application/02-value-proposition.md) |
| 주요 기능 5개 | [`docs/application/03-key-features.md`](./docs/application/03-key-features.md) |
| 타깃 사용자 / 시장 | [`docs/application/04-target-market.md`](./docs/application/04-target-market.md) |
| 비즈니스 모델 | [`docs/application/05-business-model.md`](./docs/application/05-business-model.md) |
| 문제 정의 | [`docs/application/06-problem-definition.md`](./docs/application/06-problem-definition.md) |
| 문제 규모 | [`docs/application/07-problem-scale.md`](./docs/application/07-problem-scale.md) |
| 기존 솔루션의 한계 | [`docs/application/08-existing-limitations.md`](./docs/application/08-existing-limitations.md) |
| 접근 차별성 | [`docs/application/09-differentiation.md`](./docs/application/09-differentiation.md) |
| XRPL 선택 이유 | [`docs/application/10-why-xrpl.md`](./docs/application/10-why-xrpl.md) |
| 아키텍처 | [`docs/architecture.md`](./docs/architecture.md) |
| XRPL 통합 가이드 | [`docs/xrpl-integration.md`](./docs/xrpl-integration.md) |
| 데모 시나리오 | [`docs/demo-scenario.md`](./docs/demo-scenario.md) |

> 통합 신청서 본문(개인정보 포함)은 git 저장소에 포함되지 않습니다. 신청 시점에 별도 작성해 제출합니다.

---

## 기술 스택

- **Frontend**: Next.js 15 App Router (React 19) + Tailwind CSS v4
- **Backend**: Next.js Route Handlers (Node.js runtime)
- **DB**: better-sqlite3 (단일 파일)
- **XRPL**: `xrpl` v4 — WebSocket Testnet (`wss://s.altnet.rippletest.net:51233`)
- **Hosting**: Vercel (Fluid Compute)

## XRPL Testnet 트랜잭션 증빙

### 지갑

| 역할 | 주소 | Explorer |
|------|------|---------|
| 셀러 | `rMSJe2Poj2ZYVz4Q4rUqKNAdDVegBNiD3W` | [testnet.xrpl.org/accounts](https://testnet.xrpl.org/accounts/rMSJe2Poj2ZYVz4Q4rUqKNAdDVegBNiD3W) |
| 구매자 | `rro1WV8FmGdJ5FDREWvBBjuVS7dAYr5Tt` | [testnet.xrpl.org/accounts](https://testnet.xrpl.org/accounts/rro1WV8FmGdJ5FDREWvBBjuVS7dAYr5Tt) |
| RLUSD Testnet issuer | `rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV` | [livenet.xrpl.org/accounts](https://livenet.xrpl.org/accounts/rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV) |

### E2E 데모 트랜잭션 (2026-05-13 발행)

| 단계 | 종류 | tx hash |
|------|-----|--------|
| 1. 셀러 RLUSD Trust Line | TrustSet | [`B75FF55C…83C8AE`](https://testnet.xrpl.org/transactions/B75FF55C05FA69FF8C91D3AE083BB9185E81D143230A7E605E1D198CE083C8AE) |
| 2. 구매자 RLUSD Trust Line | TrustSet | [`AFFFA902…1D76B`](https://testnet.xrpl.org/transactions/AFFFA9025043895490CB7B564EF83F84C90D8AD827B609261BBE82CC5B41D76B) |
| 3. 주문 락업 (10 XRP) | EscrowCreate | [`519B097B…99AACC`](https://testnet.xrpl.org/transactions/519B097BAB3A09E0CDE26E94245AE1785AD062590473B37B4D1D0E44B799AACC) |
| 4. 정산 해제 | EscrowFinish | [`8DA0A784…888616`](https://testnet.xrpl.org/transactions/8DA0A78441EA618E3BE1C31D86A09E0472026CB479B51DFA9B228C6E1C888616) |
| 5. 부분 환불 3 XRP | Payment | [`092ED38C…738453`](https://testnet.xrpl.org/transactions/092ED38C894B2BD115DBD02E4DC98245880ABC681E3B55B1AAED63D142738453) |

> 신청서 평가위원이 위 링크를 클릭하면 testnet.xrpl.org에서 동일 해시·금액·계정으로 검증 가능합니다.

## 진행 단계

- [x] 아이디어·기획
- [x] **MVP 개발 (현재)**
- [ ] MVP 보유 + 실데이터 검증
- [ ] 본 PoC 출범

## 팀

- **HYBLOCK** — Korea Financial Innovation Program 2026 신청 팀

## License

MIT — see [LICENSE](./LICENSE)
