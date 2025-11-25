# Q1. 조건부 타입이란?

A. 
> **조건에 따라 다른 타입을 반환하는 기능**이며, 삼항 연산자와 비슷한 문법을 사용

기본 문법: `T extends U ? X : Y`

T가 U에 할당 가능하면(extends) → X 타입 반환
그렇지 않으면 → Y 타입 반환

```ts
// 간단 예시
type IsString<T> = T extends string ? "예스" : "노";

type A = IsString<string>;  // "예스"
type B = IsString<number>;  // "노"

// 실용적 예시
// 배열이면 요소 타입을 추출, 아니면 그대로
type Flatten<T> = T extends Array<infer U> ? U : T;

type Str = Flatten<string[]>;  // string
type Num = Flatten<number>;    // number
```

사용 이유
1. 타입을 동적으로 결정
2. 타입 추론을 정교하게 만들 수 있음
3. 유틸리티 타입을 직접 생성

**infer** 란?
**"타입 변수 선언 + 자동 추론"**을 동시에 하는 키워드

* 동작 방식

```ts
// 1. infer는 "타입 변수"를 선언하고
// 2. 타입스크립트가 자동으로 그 타입을 "추론"해줌

type ReturnType<T> = T extends (...args: any[]) => infer R 
  ? R      // R을 여기서 사용 가능!
  : never;

// R은 어떻게 정해지나?
// → 타입스크립트가 함수 반환 타입을 "자동으로" R에 할당
```

# Q2. PickOne 커스텀 유틸리티 타입?

A. 
> 여러 속성 중 **딱 하나만 선택** 할 수 있도록 강제하는 타입, 직접 구현해야 함.

* 작동 방식 및 예시

```ts
type Payment = {
  card: string;
  cash: number;
};

type PaymentMethod = PickOne<Payment>;

// 1단계: 각 키마다 분리
// { card: Pick<Payment, 'card'> & Partial<Record<'cash', never>> }
// { cash: Pick<Payment, 'cash'> & Partial<Record<'card', never>> }

// 2단계: 실제 타입 계산
// { card: string; cash?: never } | { cash: number; card?: never }

type Payment = {
  card: string;
  cash: number;
};

type PaymentMethod = PickOne<Payment>;

// ✅ 정상: card만 있음
const payment1: PaymentMethod = { card: "1234-5678" };

// ✅ 정상: cash만 있음
const payment2: PaymentMethod = { cash: 5000 };

// ❌ 에러: 둘 다 있으면 안 됨
const payment3: PaymentMethod = { 
  card: "1234-5678", 
  cash: 5000 
};

// ❌ 에러: 하나는 있어야 함
const payment4: PaymentMethod = {};

```

# Q3. Partial Record 패턴이 뭔데??????

A. 
> "여러 개의 선택지가 있는데, 그 중 아무거나 골라도 되고 안 골라도 되는 객체"

```ts
// Record: 모든 토핑을 반드시 선택해야 함
type 피자주문 = Record<'페퍼로니' | '치즈' | '올리브', boolean>;

const 주문1: 피자주문 = {
  페퍼로니: true,
  치즈: true,
  올리브: false  // 모두 답해야 함! 😰
};

// Partial Record: 원하는 토핑만 골라도 됨
type 피자주문 = Partial<Record<'페퍼로니' | '치즈' | '올리브', boolean>>;

const 주문1: 피자주문 = {
  페퍼로니: true  // 이것만 선택! ✅
};

const 주문2: 피자주문 = {
  치즈: true,
  올리브: true  // 원하는 것만! ✅
};

const 주문3: 피자주문 = {};  // 아무것도 안 골라도 OK! ✅
```

언제 쓰나요?
✅ 쓰면 좋을 때

* 사용자가 일부만 입력해도 될 때
* 기본값이 있어서 안 채워도 될 때
* 동적으로 나중에 추가할 때

❌ 안 쓰는 게 좋을 때

* 반드시 모든 값이 필요할 때
* 빈 객체를 허용하면 안 될 때