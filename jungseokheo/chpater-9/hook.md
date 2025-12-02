# React Hooks 완전 정리

## 목차
1. [useState](#1-usestate)
2. [useEffect](#2-useeffect)
3. [useMemo와 useCallback](#3-usememo와-usecallback)
4. [useRef](#4-useref)
5. [커스텀 Hook](#5-커스텀-hook)

---

## 1. useState

### 기본 구조
- 상태 값과 setState 함수
- 구조 분해 할당으로 사용

### React의 상태 관리 방식
- **배열 기반 저장**: React는 각 컴포넌트의 Hook을 배열에 순서대로 저장
- **인덱스로 구분**: 호출 순서(인덱스)로 각 useState를 구분
- **호출 순서의 중요성**: 매 렌더링마다 같은 순서로 호출되어야 함

### 렌더링 과정
- **첫 렌더링**: 초기값 저장
- **리렌더링**: 저장된 값 읽어오기
- **변수 자체는 매번 새로 만들어짐** (새로운 변수 생성)
- **하지만 그 변수에 들어가는 값은 React 배열에서 읽어옴** (값 참조)

```typescript
// 첫 렌더링
const [count, setCount] = useState(0);  // React 배열[0] = 0 저장

// setCount(5) 호출!

// 리렌더링
const [count, setCount] = useState(0);  // 0은 무시, React 배열[0]에서 5를 꺼내옴
```

### setState의 역할
- **상태 값 변경**: React 배열의 해당 인덱스 값 업데이트
- **리렌더링 트리거**: 새로운 값이 이전 값과 다르면 컴포넌트 리렌더링 예약

### 규칙
- **조건문/반복문 안에서 사용 금지**
- **이유**: React 배열의 index가 꼬여 index로 구분하는 상태 관리 방식에 차질이 생김

```typescript
// ❌ 안 됨
if (condition) {
  const [name, setName] = useState('');
}

// ✅ 됨
const [name, setName] = useState('');
if (condition) {
  // ...
}
```

---

## 2. useEffect

### 기본 구조
- 첫 번째 인자: effect 콜백 함수
- 두 번째 인자: 의존성 배열 (옵셔널)
- 반환값: cleanup 함수 또는 void
- 타입: async 함수 불가 (Promise 반환하면 안 됨)

### React의 effect 관리 방식
- useState처럼 배열 기반 저장
- **이전 의존성 배열 값을 저장**
- **얕은 비교(참조 비교)로 변경 감지**

### 의존성 배열 패턴
```typescript
// 없음: 매 렌더링마다 실행
useEffect(() => {
  console.log('항상 실행');
});

// 빈 배열 []: 마운트 시에만 실행
useEffect(() => {
  console.log('마운트 시에만');
}, []);

// [값들]: 해당 값 변경 시에만 실행
useEffect(() => {
  console.log('count 변경 시에만');
}, [count]);
```

### cleanup 함수 (Destructor)

**실행 시점:**
- 의존성이 바뀌어서 effect를 다시 실행하기 직전
- 컴포넌트가 언마운트될 때

**용도:** 이전 effect에서 설정한 것들을 정리
- 타이머 제거 (clearInterval, clearTimeout)
- 이벤트 리스너 제거 (removeEventListener)
- 구독 취소 (unsubscribe)
- API 요청 취소 (경쟁 상태 방지)
- 메모리 누수 방지

```typescript
useEffect(() => {
  const timer = setInterval(() => {
    console.log('째깍');
  }, 1000);
  
  return () => {
    clearInterval(timer);  // cleanup
  };
}, []);
```

### 주의사항

**async 함수 직접 사용 불가**
```typescript
// ❌ async는 Promise 반환
useEffect(async () => {
  await fetch('/api');
}, []);

// ✅ 내부에서 async 함수 선언 후 호출
useEffect(() => {
  const fetchData = async () => {
    await fetch('/api');
  };
  fetchData();
}, []);
```

**객체/배열 deps 주의**
- 이유: 얕은 비교(참조 비교)로 매번 새 객체는 다르다고 판단
- 해결책: 실제 사용하는 원시 값을 deps에 넣기

```typescript
// ❌ 객체 전체
useEffect(() => {
  console.log(user.name);
}, [user]);  // user 참조 변경 시마다 실행

// ✅ 실제 사용하는 값만
useEffect(() => {
  console.log(user.name);
}, [user.name]);  // name 값이 실제로 변경될 때만
```

**비동기 작업 패턴 (경쟁 상태 방지)**
```typescript
useEffect(() => {
  let cancelled = false;
  
  const fetchData = async () => {
    const data = await fetch('/api');
    if (!cancelled) {
      setData(data);
    }
  };
  
  fetchData();
  
  return () => {
    cancelled = true;
  };
}, []);
```

---

## 3. useMemo와 useCallback

### 공통점: 메모이제이션(Memoization)
- **목적**: 이전에 계산한 값을 저장해서 불필요한 재계산 방지
- **핵심**: 리렌더링은 여전히 발생하지만, 특정 연산만 건너뛸 수 있음
- **deps 동작**: useEffect처럼 얕은 비교로 의존성 변경 감지

### useMemo - 계산 결과 메모이제이션

```typescript
const expensiveResult = useMemo(() => {
  return calculateSomething(data);
}, [data]);  // data가 변경될 때만 재계산
```

**동작:**
- 의존성 배열의 값이 변경될 때만 재계산
- 변경되지 않으면 이전에 계산된 값 반환
- 계산 결과(값)를 저장

### useCallback - 함수 메모이제이션

```typescript
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);  // count 변경 시 함수 재생성
```

**동작:**
- 의존성 배열의 값이 변경될 때만 함수 새로 생성
- 변경되지 않으면 이전 함수 재사용
- 함수 자체를 저장

**클로저 주의:**
```typescript
// ❌ deps에 count 없음 → 항상 초기값(0) 출력
const handleClick = useCallback(() => {
  console.log(count);
}, []);

// ✅ count 변경 시 함수 재생성 → 최신 값 참조
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);
```

### 언제 사용해야 하는가?

**✅ 사용해야 하는 경우:**

**useMemo:**
- 계산 비용이 높은 연산
- 렌더링마다 동일한 결과를 반복 계산하는 경우

**useCallback:**
- React.memo로 최적화된 자식 컴포넌트에 props로 전달할 함수
- useEffect의 deps에 포함될 함수
- 커스텀 Hook에서 반환하는 함수

```typescript
const MemoizedChild = React.memo(({ onClick }) => {
  return <button onClick={onClick}>버튼</button>;
});

function Parent() {
  const handleClick = useCallback(() => {
    console.log('클릭');
  }, []);  // ✅ 의미 있음: MemoizedChild 불필요한 리렌더링 방지
  
  return <MemoizedChild onClick={handleClick} />;
}
```

**❌ 사용하지 말아야 하는 경우:**
- 간단한 계산이나 함수 (메모이제이션 비용 > 생성 비용)
- 자식이 React.memo로 감싸지지 않은 경우
- deps가 매번 변경되는 경우 (메모이제이션 효과 없음)

### 주의사항
- 사용하는 모든 값을 deps에 포함
- 누락 시 오래된 값(클로저) 참조 문제 발생
- 객체/배열 deps 주의 (얕은 비교)

---

## 4. useRef

### 정의
**리렌더링을 일으키지 않고 값을 저장/참조**

**두 가지 용도:**
1. 일반 값 저장 (타이머 ID, 렌더링 횟수 등)
2. DOM 요소 직접 접근

### useState vs useRef

| | useState | useRef |
|---|---|---|
| 변경 시 리렌더링 | ✅ | ❌ |
| 변경 방법 | setState 함수 | .current 직접 할당 |
| 값 조회 시점 | 다음 렌더링 후 | 즉시 |

**왜 리렌더링 안 될까?**
- setState: React에게 알려줌 → 리렌더링
- .current 할당: React에게 안 알려줌 → 리렌더링 없음

### 타입 정의

```typescript
// 1. 일반 값 저장 (Mutable)
const countRef = useRef(0);
countRef.current = 1;  // ✅ 변경 가능

// 2. DOM 참조 (ReadOnly)
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current = ...;  // ❌ React가 자동 할당, 직접 변경 금지
```

### DOM 접근

```typescript
const inputRef = useRef<HTMLInputElement>(null);

const handleClick = () => {
  inputRef.current?.focus();
};

return <input ref={inputRef} />;
```

**HTML 요소 타입:**
```typescript
useRef<HTMLInputElement>(null)
useRef<HTMLDivElement>(null)
useRef<HTMLButtonElement>(null)
useRef<HTMLTextAreaElement>(null)
```

### forwardRef - 자식에게 ref 전달

```typescript
// ref는 props로 전달 불가 (React 예약어)
const MyInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} />;
});

// 사용
const Parent = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  return <MyInput ref={inputRef} />;
};
```

**타입 정의:**
```typescript
function forwardRef<T, P = {}>(
  render: ForwardRefRenderFunction<T, P>
): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>>;

// T: ref로 전달할 요소의 타입
// P: 일반 props의 타입
```

### useImperativeHandle - 커스텀 인터페이스

```typescript
type Handle = {
  submit: () => void;
};

const Form = forwardRef<Handle, Props>((props, ref) => {
  useImperativeHandle(ref, () => ({
    submit: () => {
      // 검증 로직
      // 데이터 가공
      // API 호출
      // 실제 submit
    }
  }));
  
  return <form>...</form>;
});

// 부모: 자식이 정의한 메서드만 호출 가능 (캡슐화)
ref.current?.submit();
```

**장점:**
- 캡슐화: 내부 구현 변경 시 부모 코드 수정 불필요
- 명확한 인터페이스: 부모가 사용할 수 있는 기능이 명확
- 유지보수성: 로직을 한 곳에서 관리

### 주의사항

```typescript
// ❌ ref 변경은 화면에 반영 안 됨
const countRef = useRef(0);
countRef.current += 1;  // 화면 안 바뀜

// ❌ useEffect deps에 ref.current 넣지 말 것
useEffect(() => {...}, [countRef.current]);  // 감지 안 됨

// ✅ 사용 기준
// 렌더링에 영향 → useState
// 로직에만 영향 → useRef
```

---

## 5. 커스텀 Hook

### 정의
반복되는 Hook 로직을 함수로 추출해 재사용

**필수 조건:**
1. 이름이 `use`로 시작
2. 내부에서 Hook 사용 (useState, useEffect 등)

### 기본 패턴

```typescript
// JavaScript
const useInput = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  const onChange = (e) => setValue(e.target.value);
  return { value, onChange };
};

// TypeScript
const useInput = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);
  
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  
  return { value, onChange };
};

// 제네릭 버전
const useInput = <T = string>(initialValue: T) => {
  const [value, setValue] = useState<T>(initialValue);
  
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value as T);
  };
  
  return { value, onChange };
};
```

### 주요 이벤트 타입

```typescript
ChangeEvent<HTMLInputElement>     // input onChange
ChangeEvent<HTMLTextAreaElement>  // textarea onChange
MouseEvent<HTMLButtonElement>     // button onClick
FormEvent<HTMLFormElement>        // form onSubmit
KeyboardEvent<HTMLInputElement>   // input onKeyDown
```

**팁:** 타입을 외우지 말고 JSX에서 이벤트 핸들러에 마우스 오버하면 IDE가 타입을 보여줌

### 실전 예시

```typescript
// Toggle
const useToggle = (initial = false) => {
  const [value, setValue] = useState(initial);
  const toggle = () => setValue(v => !v);
  return [value, toggle] as const;
};

// Fetch
const useFetch = <T,>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [url]);
  
  return { data, loading };
};
```

### 핵심 포인트

**만들 때:** 같은 패턴이 2-3곳 이상 반복  
**장점:** 로직 재사용, 코드 간결화  
**주의:** Hook 규칙 준수, deps 관리, 과도한 추상화 지양

---

## 전체 요약

### Hook의 공통 규칙
1. **최상위에서만 호출** (조건문/반복문 금지)
2. **React 함수에서만 호출** (컴포넌트 또는 커스텀 Hook)
3. **이름은 use로 시작** (커스텀 Hook의 경우)

### 선택 가이드

| 목적 | Hook |
|---|---|
| 리렌더링 필요한 상태 | useState |
| 리렌더링 불필요한 값 저장 | useRef |
| 사이드 이펙트 실행 | useEffect |
| 무거운 계산 최적화 | useMemo |
| 함수 재생성 방지 | useCallback |
| DOM 직접 접근 | useRef |
| 로직 재사용 | 커스텀 Hook |

### deps 관리 공통 원칙
- **얕은 비교**: 객체/배열은 참조 비교
- **실제 사용하는 값만**: 원시 타입 값을 deps에 포함
- **모든 의존성 포함**: 누락 시 오래된 값 참조 (클로저 문제)