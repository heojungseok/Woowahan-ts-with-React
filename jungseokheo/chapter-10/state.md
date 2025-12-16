# 10 상태 관리

## 상태(State)란?

상태는 **렌더링 결과에 영향을 주는 정보를 담은 순수 자바스크립트 객체**입니다. 리액트 앱 내의 상태는 시간이 지나면서 변할 수 있는 동적인 데이터이며, 값이 변경되면 컴포넌트의 렌더링 결과물에 영향을 줍니다.

### 상태의 분류

리액트 애플리케이션에서 상태는 크게 지역 상태, 전역 상태, 서버 상태로 분류할 수 있습니다.

#### 지역 상태(Local State)
지역 상태는 **컴포넌트 내부에서 사용되는 상태**로 예를 들어 체크박스의 체크 여부나 폼의 입력값 등이 해당됩니다. 주로 `useState` 훅을 가장 많이 사용하며 때에 따라 `useReducer`와 같은 훅을 사용하기도 합니다.

#### 전역 상태(Global State)
전역 상태는 **앱 전체에 공유하는 상태**를 의미합니다. 여러 개의 컴포넌트가 전역 상태를 사용할 수 있으며 상태가 변경되면 컴포넌트들도 업데이트됩니다. 또한 Prop drilling 문제를 피하고자 지역 상태를 해당 컴포넌트들 사이의 전역 상태로 공유할 수도 있습니다.

#### 서버 상태(Server State)
서버 상태는 **사용자 정보, 글 목록 등 외부 서버에 저장해야 하는 상태**들을 의미합니다. UI 상태와 결합하여 관리하게 되며 로딩 여부나 에러 상태 등을 포함합니다. 서버 상태는 지역 상태 혹은 전역 상태와 동일한 방법으로 관리되며 최근에는 react-query, SWR과 같은 외부 라이브러리를 사용하여 관리하기도 합니다.

---

## 상태를 잘 관리하기 위한 가이드

상태는 애플리케이션의 복잡성을 증가시키고 동작을 예측하기 어렵게 만듭니다. 상태가 업데이트될 때마다 리렌더링이 발생하므로 유지보수 및 성능 관점에서 상태 개수를 최소화하는 것이 바람직합니다.

가능하다면 상태가 없는 Stateless 컴포넌트를 활용하는 게 좋습니다. 어떤 값을 상태로 정의할 때는 다음 2가지 사항을 고려해야 합니다.

### 1. 시간이 지나도 변하지 않는다면 상태가 아니다

시간이 지나도 변하지 않는다면, 즉 컴포넌트가 마운트될 때만 스토어 객체 인스턴스를 생성하고 이후에는 변경할 필요가 없다면 굳이 객체를 상태로 관리해야 할 필요가 없습니다.

컴포넌트가 마운트될 때만 스토어 인스턴스를 생성하고 이후에는 사용만 하려고 해도 컴포넌트가 리렌더링될 때마다 `useState`는 호출되고, 이에 따라 새로운 인스턴스가 생성되지 않더라도 불필요한 초기화가 발생하는 것입니다. 따라서 객체 참조 동일성을 유지하기 위해 **`useMemo`를 사용**하거나 **`useRef`를 사용**할 수 있습니다.

#### 잘못된 예시
```typescript
const Component: React.VFC = () => {
  const [store] = useState(() => new Store());
  
  return (
    <StoreProvider store={store}>
      <Children />
    </StoreProvider>
  );
};
```
**문제점**

* useState를 사용했지만 값을 변경하지 않으므로 상태로 관리할 필요가 없음
* 매 렌더링마다 useState가 호출됨 (초기화 함수는 첫 렌더링에만 실행되지만)
* 불필요한 상태 관리 오버헤드

#### 해결 방법 

1. useState로 초기화 함수 사용
```typescript
const [store] = useState(() => new Store());
```
* 초기화 함수를 사용하면 첫 렌더링에만 Store 인스턴스가 생성됨
* 하지만 여전히 매 렌더링마다 useState는 호출됨

2. useMemo 사용

```typescript
const store = useMemo(() => new Store(), []);
```
* 의존성 배열이 빈 배열이므로 첫 렌더링에만 생성
* 이후 렌더링에서는 메모이제이션된 값을 반환

3. useRef 사용 (권장)
```typescript
const store = useRef<Store>(null);

if (!store.current) {
  store.current = new Store();
}
```

* useRef는 컴포넌트가 마운트될 때 한 번만 초기화되고 이후에는 동일한 ref 객체를 반환하기 때문에

**정리**
> * 시간이 지나도 변하지 않는 값은 상태가 아니라 참조를 유지해야 하는 값
> * 객체 참조 동일성 유지를 위해 useMemo 또는 useRef 사용
> * 특히 초기값만 설정하고 이후 변경하지 않는 경우 useRef가 가장 적절

---

### 2. 파생된 값은 상태가 아니다

**SSOT (Single Source of Truth) 원칙**
리액트에서는 SSOT(Single Source of Truth)를 유지해야 합니다. 하나의 데이터는 하나의 출처만 가져야 하며, 여러 곳에서 같은 데이터를 관리하면 동기화 문제가 발생합니다.

#### 2-1. 부모에게서 props로 전달받으면 상태가 아니다

#### 잘못된 예시 
```typescript
// ❌ 잘못된 예시
type UserEmailProps = {
  email: string;
};

const UserEmail: React.VFC<UserEmailProps> = ({ email }) => {
  const [emailValue, setEmailValue] = useState(email);
  
  const onChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailValue(event.target.value);
  };
  
  return (
    <div>
      <input type="text" value={emailValue} onChange={onChangeEmail} />
    </div>
  );
};
```

**문제점**

* props와 state의 불일치: props로 받은 email이 변경되어도 emailValue는 최초 마운트 시점의 email 값으로 고정됨
* SSOT 원칙 위반: email이라는 데이터가 props와 state 두 곳에 존재하여 어느 것이 진짜 데이터인지 알 수 없음
* 동기화 문제: 부모의 email과 자식의 emailValue가 서로 다른 값을 가질 수 있음

#### 해결 방법

**상태 끌어올리기(Lifting State Up) 패턴**

```typescript
// ✅ 올바른 예시: 상태 끌어올리기 패턴 적용
import { useState } from "react";

type UserEmailProps = {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
};

const UserEmail: React.VFC<UserEmailProps> = ({ email, setEmail }) => {
  const onChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value); // 부모의 setState 함수 호출
  };
  
  return (
    <div>
      <input type="text" value={email} onChange={onChangeEmail} />
    </div>
  );
};
```

**정리**

> * 상태는 부모 컴포넌트에서 관리: email 상태는 부모 컴포넌트의 useState로 관리
> * 값과 setter 함수를 props로 전달: 자식은 email 값과 setEmail 함수를 모두 props로 받음
> * 자식은 상태를 직접 관리하지 않음: 자식은 받은 값을 표시하고, 변경이 필요하면 부모의 setter 함수를 호출

```
리액트의 단일 책임 원칙
email을 변경하는 책임은 UserEmail 컴포넌트가 아니라 email prop을 내려주는 부모 컴포넌트에 있습니다.

자식 컴포넌트는 부모로부터 받은 데이터를 표시하는 책임만 가지고 상태 변경이 필요하면 부모에게 알림(부모의 setState 호출)그리고 상태를 직접 소유하거나 관리하지 않습니다.
```

#### 2-2. props 혹은 기존 상태에서 계산할 수 있는 값은 상태가 아니다

다른 상태로부터 계산될 수 있는 값은 별도의 상태로 관리하면 안 됩니다. 이러한 값을 상태로 관리하면 동기화 문제가 발생합니다.

#### 잘못된 예시
```typescript
// ❌ items와 selectedItems를 별도 상태로 관리
const [items, setItems] = useState<Item[]>([]);
const [selectedItems, setSelectedItems] = useState<Item[]>([]);

useEffect(() => {
  setSelectedItems(items.filter((item) => item.isSelected));
}, [items]);
```

**문제점**

1. **동기화 복잡도**: items가 변경될 때마다 selectedItems를 useEffect로 동기화해야 함
2. **타이밍 이슈**: useEffect는 렌더링 이후에 실행되므로 일시적으로 불일치 상태 발생
3. **불필요한 리렌더링**: setSelectedItems 호출로 추가 렌더링
4. **버그 위험**: 동기화 로직 누락 시 데이터 불일치

#### 해결방법 

1. 렌더링 시 계산
```typescript
// ✅ 필요할 때마다 계산
const [items, setItems] = useState<Item[]>([]);
const selectedItems = items.filter(item => item.isSelected);
```
* 항상 최신 상태 보장 (동기화 불필요)
* 코드가 간결하고 명확
* 버그 발생 가능성 감소
* SSOT 원칙 준수

2. useMemo로 최적화

```typescript
const selectedItems = useMemo(
  () => items.filter(item => item.isSelected),
  [items]
);
```
* 계산 비용이 크다면 useMemo를 사용할 수 있음.

단, **먼저 일반 계산으로 작성하고 실제 성능 문제가 발생할 때 useMemo를 고려**하는 것이 좋습니다.

---

#### 파생된 값의 두 가지 유형

1. 부모에게서 props로 전달받은 값

  * props를 state로 복사하지 말 것
  * 상태 끌어올리기(Lifting State Up) 패턴 사용
  * 상태와 setter 함수를 모두 props로 전달
  * 자식은 상태를 직접 관리하지 않음


2. 기존 상태에서 계산 가능한 값

  * 별도의 상태로 관리하지 말 것
  * 렌더링 시 계산
  * 성능 이슈가 실제로 발생하면 useMemo 고려

---

### 3. useState vs useReducer, 어떤 것을 사용해야 할까

1. 다수의 하위 필드를 포함하고 있는 복잡한 상태 로직을 다룰 때
2. 다음 상태가 이전 상태에 의존적일 때

#### 문제 상황: 상태 구조
```ts
// 날짜 범위 기준 - 오늘, 1주일, 1개월
type DateRangePreset = "TODAY" | "LAST_WEEK" | "LAST_MONTH";

type ReviewRatingString = "1" | "2" | "3" | "4" | "5";

interface ReviewFilter {
  // 리뷰 날짜 필터링
  startDate: Date;
  endDate: Date;
  dateRangePreset: Nullable<DateRangePreset>;
  
  // 키워드 필터링
  keywords: string[];
  
  // 리뷰 점수 필터링
  ratings: ReviewRatingString[];
  
  // ... 이외 기타 필터링 옵션
}

// Review List Query State
interface State {
  filter: ReviewFilter;
  page: string;
  size: number;
}

```

**문제점**
상태를 업데이트할 때마다 잠재적인 오류 가능성이 증가.

페이지값만 업데이트하고 싶어도 우선 전체 데이터를 가지고 온 다음 페이지값을 덮어쓰게 되므로 사이즈나 필터 값은 다른 필드가 수정될 수 있어 의도치 않은 오류가 발생할 수 있습니다.

'사이즈 필드를 업데이트할 때는 페이지 필드를 0으로 설정해야 한다' 등의 특정한 업데이트 규칙이 있다면 `useState`만으로는 한계가 있습니다.

#### useReducer를 사용한 해결

* dispatch를 통해 어떤 작업을 할지를 액션으로 넘김
* reducer 함수 내에서 상태를 업데이트하는 방식을 정의

```ts
// Action 정의
type Action = 
  | { payload: ReviewFilter; type: "filter"; }
  | { payload: number; type: "navigate"; }
  | { payload: number; type: "resize"; };

// Reducer 정의
const reducer: React.Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case "filter":
      return {
        filter: action.payload,
        page: 0,  // filter 변경 시 page를 0으로 초기화
        size: state.size,
      };
    case "navigate":
      return {
        filter: state.filter,
        page: action.payload,
        size: state.size,
      };
    case "resize":
      return {
        filter: state.filter,
        page: 0,  // size 변경 시 page를 0으로 초기화
        size: action.payload,
      };
    default:
      return state;
  }
};

// useReducer 사용
const [state, dispatch] = useReducer(reducer, getDefaultState());

// dispatch 예시
dispatch({ payload: filter, type: "filter" });
dispatch({ payload: page, type: "navigate" });
dispatch({ payload: size, type: "resize" });
```

**useReducer 사용의 이점**

* 업데이트 규칙이 명확함: "resize" 시 page를 0으로 초기화하는 로직이 reducer 안에 캡슐화됨
* 의도치 않은 오류 방지: 각 액션에 따른 상태 변경이 명확히 정의되어 있음
* 코드 가독성: 어떤 작업(action)을 수행하는지가 명확함

**정리**
>useState를 사용하는 경우
> * 단순한 상태 (문자열, 숫자, boolean 등)
> * 상태 업데이트 로직이 간단한 경우
> * 독립적인 상태들

>useReducer를 사용하는 경우
> * 복잡한 상태 로직: 다수의 하위 필드를 포함한 객체
> * 의존적인 상태 업데이트: 다음 상태가 이전 상태에 의존
> * 특정 업데이트 규칙: 한 필드 변경 시 다른 필드도 함께 변경되어야 하는 경우
> * Boolean 토글: 간단한 토글 상태도 useReducer로 더 간결하게 작성 가능

---

## 전역 상태 관리와 상태 관리 라이브러리 

## Context API

### 개념
Context API는 **리액트에서 제공하는 내장 기능**으로, 컴포넌트 트리 전체에 데이터를 제공할 수 있는 방법입니다. props drilling 문제를 해결하기 위해 사용됩니다.

### 특징
- React 16.3 버전부터 정식 지원
- 전역 상태 관리를 위한 기본적인 방법 제공
- `createContext`, `Provider`, `useContext`로 구성
- 별도의 외부 라이브러리 설치 불필요

### 장점
- 추가 라이브러리 없이 사용 가능
- 간단한 전역 상태 관리에 적합
- React의 기본 기능으로 안정적

### 단점
- Provider 중첩이 많아지면 Provider Hell 발생
- 성능 최적화가 어려움 (Context 값이 변경되면 모든 Consumer가 리렌더링)
- 복잡한 상태 로직 관리에는 부적합
- 상태 업데이트 로직과 컴포넌트가 강하게 결합됨

---

## MobX

### 개념
**객체지향 프로그래밍과 반응형 프로그래밍 패러다임의 영향**을 받은 상태 관리 라이브러리입니다.

### 특징
- **Observable을 통한 자동 상태 추적**
- 상태 변경 시 자동으로 관련 컴포넌트 업데이트
- 데코레이터 문법 지원 (선택적)
- 객체지향적 접근 방식

### 장점
- 직관적이고 간단한 문법
- 보일러플레이트 코드가 적음
- 러닝 커브가 낮음
- 자동으로 성능 최적화

### 단점
- 자유도가 높아 팀 컨벤션이 중요
- 데이터 흐름을 명확히 파악하기 어려울 수 있음

---

## Redux

### 개념
**함수형 프로그래밍의 영향**을 받은 라이브러리로, **Flux 패턴**을 기반으로 합니다.

### 특징
- **단일 스토어(Single Store)** 사용
- **불변성 원칙**: 상태를 직접 수정하지 않고 새로운 상태 객체 반환
- **액션(Action)**과 **리듀서(Reducer)**를 통한 상태 관리
- Prop drilling 문제 해결
- Redux Toolkit으로 보일러플레이트 감소

### 장점
- 예측 가능한 상태 관리
- 강력한 개발자 도구 (Redux DevTools)
- 미들웨어를 통한 확장성 (redux-saga, redux-thunk 등)
- 대규모 애플리케이션에 적합
- 풍부한 생태계와 커뮤니티

### 단점
- 초기 설정이 복잡 (보일러플레이트 코드 많음)
- 러닝 커브가 높음
- 간단한 상태 관리에는 과한 설정

---

## Recoil

### 개념
**Meta(Facebook)에서 만든 라이브러리**로, React를 위해 설계된 상태 관리 라이브러리입니다.

### 특징
- **Atom**: 상태의 단위, 컴포넌트가 구독 가능
- **Selector**: 파생된 상태(derived state)를 나타냄
- React의 Hook과 유사한 API
- 비동기 처리 내장 지원

### 장점
- React스러운 API (Hook 기반)
- 작은 단위로 상태를 쪼개서 관리 가능
- 비동기 상태 관리가 간편
- 동시성 모드(Concurrent Mode) 지원
- 코드 분할(Code Splitting)에 유리

### 단점
- 상대적으로 최신 라이브러리 (생태계가 작음)
- 아직 실험적인 기능들이 있음
- 서버 사이드 렌더링(SSR) 지원 제한적

---

## Zustand

### 개념
**Flux 패턴을 사용하지만 Redux보다 훨씬 간단한 API**를 제공하는 가벼운 상태 관리 라이브러리입니다.

### 특징
- 단순하고 직관적인 API
- Hook 기반
- Provider 없이 사용 가능
- Redux DevTools 지원
- 미들웨어 지원

### 장점
- 매우 간단한 설정과 사용법
- 보일러플레이트가 거의 없음
- 번들 크기가 작음 (약 1KB)
- Redux DevTools 사용 가능
- TypeScript 지원 우수

### 단점
- 생태계가 Redux만큼 크지 않음
- 복잡한 상태 로직에는 구조화가 필요

---

## Jotai

### 개념
**Recoil에서 영감을 받아 만들어진 원자적(Atomic) 상태 관리 라이브러리**입니다.

### 특징
- **Atom 기반의 최소 단위 상태 관리**
- Bottom-up 접근 방식
- Provider가 선택적 (필요한 경우만 사용)
- TypeScript 우선 설계
- React Suspense와 통합

### 장점
- Recoil보다 더 가볍고 간단
- 불필요한 리렌더링 최소화
- 번들 크기가 작음
- TypeScript 지원 우수
- 학습 곡선이 낮음

### 단점
- 상대적으로 새로운 라이브러리
- 커뮤니티와 생태계가 작음
- 복잡한 애플리케이션에서의 검증 부족

---

## 비교표

| 특성 | Context API | MobX | Redux | Recoil | Zustand | Jotai |
|------|-------------|------|-------|--------|---------|-------|
| **제공** | React 내장 | 외부 라이브러리 | 외부 라이브러리 | Meta | 외부 라이브러리 | 외부 라이브러리 |
| **패러다임** | - | 객체지향/반응형 | 함수형/Flux | Atomic | Flux | Atomic |
| **번들 크기** | 0 (내장) | 중간 | 큼 | 중간 | 매우 작음 (~1KB) | 매우 작음 (~3KB) |
| **러닝 커브** | 낮음 | 낮음 | 높음 | 중간 | 낮음 | 낮음 |
| **보일러플레이트** | 적음 | 적음 | 많음 | 적음 | 매우 적음 | 매우 적음 |
| **성능 최적화** | 어려움 | 자동 | 수동 | 자동 | 자동 | 자동 |
| **DevTools** | 제한적 | ✅ | ✅ 강력함 | ✅ | ✅ | ✅ |
| **비동기 처리** | 수동 | 쉬움 | 미들웨어 필요 | 내장 | 수동 | 내장 |
| **TypeScript** | ✅ | ✅ | ✅ | ✅ | ✅ 우수 | ✅ 우수 |
| **미들웨어** | ❌ | ✅ | ✅ 풍부 | 제한적 | ✅ | 제한적 |
| **생태계** | React | 중간 | 매우 큼 | 성장 중 | 성장 중 | 작음 |
| **SSR 지원** | ✅ | ✅ | ✅ | 제한적 | ✅ | ✅ |
| **코드 분할** | 어려움 | 가능 | 가능 | 쉬움 | 가능 | 쉬움 |
| **적합한 규모** | 소규모 | 중소규모 | 대규모 | 중규모 | 중소규모 | 소중규모 |

---

## 선택 가이드

### Context API
- ✅ 간단한 전역 상태 관리
- ✅ 외부 라이브러리를 추가하고 싶지 않을 때
- ✅ 테마, 로케일 등 변경 빈도가 낮은 데이터

### MobX
- ✅ 객체지향 프로그래밍에 익숙한 팀
- ✅ 빠른 개발이 필요할 때
- ✅ 자유로운 구조를 선호할 때

### Redux
- ✅ 대규모 애플리케이션
- ✅ 예측 가능한 상태 관리가 중요할 때
- ✅ 강력한 미들웨어가 필요할 때
- ✅ 팀 컨벤션이 명확해야 할 때

### Recoil
- ✅ React 생태계에 친화적인 라이브러리를 원할 때
- ✅ 비동기 상태 관리가 많을 때
- ✅ 작은 단위로 상태를 분리하고 싶을 때

### Zustand
- ✅ 간단하고 가벼운 라이브러리를 원할 때
- ✅ 빠르게 시작하고 싶을 때
- ✅ Redux의 복잡함 없이 Flux 패턴을 원할 때

### Jotai
- ✅ Recoil보다 더 가볍고 간단한 것을 원할 때
- ✅ TypeScript를 적극적으로 사용할 때
- ✅ 최소한의 보일러플레이트를 원할 때

---

## 핵심 정리

### 상태로 관리해야 하는 것
- 시간에 따라 변하는 값
- 사용자 인터랙션에 의해 변경되는 값
- 렌더링에 영향을 주는 동적 데이터

### 상태로 관리하지 말아야 하는 것
- 시간이 지나도 변하지 않는 값 → useMemo나 useRef 사용
- 부모로부터 props로 전달받은 값 → props를 직접 사용
- 다른 상태나 props로 계산 가능한 값 → 렌더링 시 계산 or useMemo

### 원칙
- **SSOT(Single Source Of Truth)**: 하나의 진실 공급원만 유지
- **최소한의 상태**: 상태 개수를 최소화하여 복잡도 감소
- **리액트의 단일 책임 원칙**: 각 컴포넌트는 하나의 책임만 가져야 함