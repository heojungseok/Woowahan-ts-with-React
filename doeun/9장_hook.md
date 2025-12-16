# 9장 hook

## 1. React Hooks가 필요한 이유

### 1.1 클래스 컴포넌트의 문제점

React v16.8 이전에는 클래스 컴포넌트를 사용해야 했고, 다음과 같은 문제가 있었습니다.

**1. 컴포넌트 간 상태 로직 재사용의 어려움**
- 상태 로직을 공유하려면 HOC(Higher Order Component)나 Render Props 패턴이 필요했습니다
- 코드 구조가 복잡해졌습니다.

**2. 복잡한 생명주기 메서드**
- `componentDidMount`, `componentDidUpdate` 등에 여러 기능이 섞여 있었습니다.
- 관심사를 분리하기 어려웠습니다.

**3. this 바인딩 문제**
- 클래스 메서드에서 this를 직접 바인딩해야 했습니다.
- 코드 가독성이 떨어졌습니다.

**4. 테스트와 디버깅의 어려움**
- 모든 상태와 로직이 하나의 클래스에 집중되어 있어 테스트가 복잡했습니다.

```typescript
// 클래스 컴포넌트 예시
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
    // this 바인딩 필요
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    console.log('마운트됨');
    // 여러 로직이 섞임
    this.fetchData();
    this.setupEventListener();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    console.log('언마운트됨');
    this.cleanupEventListener();
  }

  handleClick() {
    this.setState({ count: this.state.count + 1 });
  }

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.handleClick}>증가</button>
      </div>
    );
  }
}
```

### 1.2 함수 컴포넌트 + Hooks의 장점
React Hooks를 사용하면 아래와 같은 이점이 있습니다.
```typescript
// 함수 컴포넌트 + Hooks
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('마운트되거나 업데이트됨');
    
    return () => {
      console.log('언마운트됨');
    };
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
    </div>
  );
}
```

**Hooks의 이점:**
1. 간결하고 직관적인 코드
2. 커스텀 훅을 통해 로직 재사용 가능
3. 관심사별 코드 분리 용이
4. this 바인딩 불필요
5. 테스트하기 쉬움

**비교표**

| 특징 | 클래스 컴포넌트 | 함수 컴포넌트 + Hooks |
|------|---------------|---------------------|
| 상태 관리 | `this.state`, `this.setState()` | `useState` |
| 생명주기 | `componentDidMount` 등 | `useEffect` |
| this 필요 | 필요 | 불필요 |
| 가독성 | 복잡함 | 간결함 |
| 재사용성 | 어려움 | 쉬움 (커스텀 훅) |
| 번들 크기 | 상대적으로 큼 | 작음 |

> **참고**: 현재 React 팀은 새로운 프로젝트에서 클래스 컴포넌트 대신 함수 컴포넌트와 Hooks 사용을 권장합니다.

---

## 2. Hooks의 규칙

React Hooks를 안전하게 사용하기 위해서는 **반드시** 다음 두 가지 규칙을 지켜야 합니다.

### 2.1 최상위에서만 호출하기

**Hook은 항상 컴포넌트의 최상위 레벨에서 호출되어야 합니다.**

- useState, useEffect 등은 조건문, 반복문, 중첩 함수 내부에서 호출하면 안 됩니다.
- 조기 반환(early return) 이후에 Hook을 호출하면 안 됩니다.

```typescript
// ❌ 잘못된 예시
function MyComponent({ shouldFetch }: { shouldFetch: boolean }) {
  // 조건문 내부에서 Hook 호출 - 잘못됨!
  if (shouldFetch) {
    const [data, setData] = useState(null); // ❌
  }

  return <div>컴포넌트</div>;
}

// ❌ 잘못된 예시 2
function MyComponent({ show }: { show: boolean }) {
  if (!show) {
    return null; // 조기 반환
  }
  
  // 조기 반환 이후 Hook 호출 - 잘못됨!
  const [value, setValue] = useState(0); // ❌
  
  return <div>{value}</div>;
}

// ✅ 올바른 예시
function MyComponent({ shouldFetch }: { shouldFetch: boolean }) {
  // Hook을 최상위에서 호출
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    // 조건은 Hook 내부에서 처리
    if (shouldFetch) {
      fetchData();
    }
  }, [shouldFetch]);

  return <div>{data}</div>;
}
```

**왜 이 규칙이 필요한가?**

React는 Hook이 호출되는 **순서**에 의존하여 각 Hook의 상태를 추적합니다. Hook의 호출 순서가 렌더링마다 달라지면, React는 어떤 `useState`가 어떤 상태를 관리하는지 알 수 없게 됩니다.

```typescript
// Hook 호출 순서가 중요한 이유
function Component({ condition }: { condition: boolean }) {
  // 첫 번째 렌더링: Hook 호출 순서 [1, 2, 3]
  const [name, setName] = useState(''); // Hook #1
  
  if (condition) {
    const [age, setAge] = useState(0);  // Hook #2 (조건부)
  }
  
  const [email, setEmail] = useState(''); // Hook #3 (또는 #2)
  
  // condition이 변경되면 Hook 호출 순서가 바뀜
  // 두 번째 렌더링: Hook 순서가 [1, 3]이 될 수 있음
  // React는 혼란에 빠짐!
}
```

### 2.2 함수 컴포넌트나 커스텀 Hook 안에서만 호출하기

**Hook은 다음 두 곳에서만 호출해야 합니다:**

1. **함수 컴포넌트 내부**
2. **커스텀 Hook 내부**

```typescript
// ❌ 일반 JavaScript 함수에서 Hook 사용 - 잘못됨!
function calculateTotal() {
  const [total, setTotal] = useState(0); // ❌
  return total;
}

// ❌ 클래스 메서드에서 Hook 사용 - 잘못됨!
class MyClass {
  method() {
    const [value, setValue] = useState(0); // ❌
  }
}

// ✅ 함수 컴포넌트에서 Hook 사용
function MyComponent() {
  const [count, setCount] = useState(0); // ✅
  return <div>{count}</div>;
}

// ✅ 커스텀 Hook에서 Hook 사용
function useCustomHook() {
  const [value, setValue] = useState(0); // ✅
  return [value, setValue] as const;
}
```

**ESLint 플러그인으로 규칙 강제하기**

```bash
npm install eslint-plugin-react-hooks --save-dev
```

```json
// .eslintrc.json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

---

## 3. useState

useState는 함수 컴포넌트에서 **상태(state)**를 관리할 때 사용하는 가장 기본적인 Hook입니다.

### 3.1 useState 타입 정의

```typescript
function useState<S>(
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>];

type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);
```

**타입 분석:**
- **S**: 상태의 타입
- **initialState**: 초기 상태 값 또는 초기 상태를 반환하는 함수
- **반환값**: `[현재 상태, 상태 업데이트 함수]` 튜플 형태의 배열
- **SetStateAction**: 상태 변경 함수는 직접 값 또는 이전 상태를 기반으로 한 함수 둘 다 받을 수 있음

### 3.2 기본 사용법

```typescript
import { useState } from 'react';

function Counter() {
  // 타입 추론: count는 number 타입
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
      <button onClick={() => setCount(prev => prev - 1)}>감소</button>
    </div>
  );
}
```
- useState는 배열을 반환하며, 첫 번째 값이 상태, 두 번째가 상태를 변경하는 함수입니다.
- 함수형 업데이트 방식(prev => prev + 1)은 이전 상태에 의존할 때 사용합니다.

### 3.3 타입스크립트와 함께 사용하기

#### 명시적 타입 지정

```typescript
import { useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  // 명시적으로 타입 지정
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${id}`);
      const data: User = await response.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '에러 발생');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <p>로딩 중...</p>}
      {error && <p>에러: {error}</p>}
      {user && <p>{user.name} ({user.email})</p>}
    </div>
  );
}
```

#### 타입 없이 사용했을 때의 문제점

```typescript
// ❌ 타입 지정 없이 사용
function MemberList() {
  const [memberList, setMemberList] = useState([
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 }
  ]);

  const addMember = () => {
    setMemberList([
      ...memberList,
      {
        name: 'Charlie',
        agee: 28 // ❌ 오타! age가 아니라 agee
      }
    ]);
  };

  // 런타임 에러 발생!
  const sumAge = memberList.reduce((sum, member) => sum + member.age, 0);
  // Charlie의 age가 undefined이므로 NaN이 됨

  return <div>총 나이: {sumAge}</div>;
}
```

#### 타입스크립트로 해결

```typescript
// ✅ 타입 지정으로 안전하게 사용
interface Member {
  name: string;
  age: number;
}

function MemberList() {
  const [memberList, setMemberList] = useState<Member[]>([]);

  const addMember = () => {
    setMemberList([
      ...memberList,
      {
        name: 'Charlie',
        agee: 28 // ❌ 컴파일 타임 에러!
        // Error: 'agee' does not exist in type 'Member'
      }
    ]);
  };

  // 타입 안정성 확보
  const sumAge = memberList.reduce((sum, member) => sum + member.age, 0);

  return <div>총 나이: {sumAge}</div>;
}
```

### 3.4 초기 상태 최적화

초기 상태 계산이 무거울 경우, useState에 함수를 전달하면 렌더링 시마다 계산되지 않습니다.

```typescript
// ❌ 매 렌더링마다 계산 실행
function Component() {
  const [value, setValue] = useState(expensiveCalculation()); // 매번 실행됨
}

// ✅ 최초 렌더링 때만 계산 실행
function Component() {
  const [value, setValue] = useState(() => expensiveCalculation()); // 한 번만 실행
}

// 실용적인 예시
function TodoList() {
  // localStorage에서 데이터 불러오기는 비용이 큰 작업
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
}
```

### 3.5 함수형 업데이트

동일한 상태 변경 함수를 여러 번 호출할 때는 함수형 업데이트를 사용하세요.

```typescript
function Counter() {
  const [count, setCount] = useState(0);

  // ❌ 클로저 문제 발생 가능
  const incrementTwice = () => {
    setCount(count + 1);
    setCount(count + 1); // count는 여전히 이전 값
   // → 실제로는 한 번만 증가
  };

  // ✅ 함수형 업데이트로 해결
  const incrementTwiceCorrect = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    //  → 실제로 두 번 증가
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={incrementTwice}>잘못된 +2</button>
      <button onClick={incrementTwiceCorrect}>올바른 +2</button>
    </div>
  );
}
```

---

## 4. useEffect

useEffect는 **렌더링 이후 수행할 작업(부수 효과, side effect)**을 처리하는 Hook입니다.
예: 데이터 요청, 이벤트 등록, 타이머 설정 등

### 4.1 useEffect 타입 정의

```typescript
function useEffect(effect: EffectCallback, deps?: DependencyList): void;

type DependencyList = readonly unknown[];
type EffectCallback = () => void | Destructor;
type Destructor = () => void;
```

**타입 분석:**
- **effect**: 부수 효과를 수행하는 콜백 함수
- **deps**: 선택적 의존성 배열
- **Destructor**: 콜백은 void 또는 정리 함수(cleanup)를 반환해야 하며, Promise를 반환하면 안 됩니다.

**중요**: `EffectCallback`은 `void` 또는 `Destructor`만 반환할 수 있으며, **Promise는 반환할 수 없습니다**.

### 4.2 기본 사용법

```typescript
import { useState, useEffect } from 'react';

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 부수 효과: 데이터 fetch
    console.log('Effect 실행');

    // 정리 함수 (cleanup)
    return () => {
      console.log('Cleanup 실행');
    };
  }, [userId]); // userId가 변경될 때마다 실행

  return <div>{user?.name}</div>;
}
```

### 4.3 의존성 배열 (deps)

의존성 배열의 값에 따라 `useEffect`의 실행 시점이 달라집니다.

```typescript
// 1. deps 없음: 매 렌더링마다 실행
useEffect(() => {
  console.log('매 렌더링마다 실행');
});

// 2. 빈 배열: 마운트 시 한 번만 실행
useEffect(() => {
  console.log('마운트 시 한 번만 실행');
}, []);

// 3. deps 있음: deps가 변경될 때마다 실행
useEffect(() => {
  console.log('userId가 변경될 때 실행');
}, [userId]);

// 4. 여러 deps: 하나라도 변경되면 실행
useEffect(() => {
  console.log('userId 또는 postId가 변경될 때 실행');
}, [userId, postId]);
```

### 4.4 비동기 작업 처리

`useEffect`의 콜백 함수는 직접 `async`로 선언할 수 없습니다.

```typescript
// ❌ 잘못된 예시
useEffect(async () => {
  const data = await fetchData(); // ❌ useEffect는 Promise를 반환하면 안 됨
}, []);

// ✅ 올바른 예시 1: 내부 함수 정의
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  fetchData();
}, []);

// ✅ 올바른 예시 2: IIFE즉시 실행 함수(IIFE)useEffect(() => {
  (async () => {
    const data = await fetchData();
    setData(data);
  })();
}, []);
```

**왜 직접 async를 사용할 수 없나?**

`asy`async` 함수는 항상 Promise를 반환합니다. 하지만 `useEffect`는 `void` 또는 정리 함수만 반환해야 합니다. Promise를 반환하면 React가 정리 함수로 인식하려고 시도하여 문제가 발생합니다

### 4.5 정리 함수 (Cleanup Function)

정리 함정리 함수는 다음 시점에 실행됩니다:
1. 컴포넌트 언마운트 시
2. 다음 effect 실행 전

```typescript
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    console.log('타이머 시작');
    
    const intervalId = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // 정리 함수: interval 정리
    return () => {
      console.log('타이머 정리');
      clearInterval(intervalId);
    };
  }, []); // 마운트 시 한 번만 실행

  return <div>경과 시간: {seconds}초</div>;
}
```

**정리 함수가 필요한 경우:**
- 타이머 정리 (`setInterval`, `setTimeout`)
- 이벤트 리스너 제거
- WebSocket 연결 종료
- 구독(subscription) 해제

```typescript
function ResizeObserver() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    // 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);

    // 정리 함수: 이벤트 리스너 제거
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div>창 너비: {width}px</div>;
}
```

### 4.6 의존성 배열과 얕은 비교 문제

**의존성 배열의 비교는 얕은 비교(shallow comparison)로 이루어집니다.**

```typescript
// ❌ 문제가 되는 예시
interface LabelProps {
  value: {
    id: string;
    name: string;
  };
}

function Label({ value }: LabelProps) {
  useEffect(() => {
    console.log('Effect 실행');
    // value를 사용하는 작업
  }, [value]); // 객체를 직접 deps에 넣음

  return <div>{value.name}</div>;
}

// 부모 컴포넌트
function Parent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>리렌더링</button>
      {/* 매 렌더링마다 새 객체 생성 */}
      <Label value={{ id: '1', name: 'John' }} />
      {/* value의 내용은 같지만, 참조가 달라 useEffect가 계속 실행됨 */}
    </div>
  );
}
```

**해결 방법 1: 객체의 개별 속성 사용**

```typescript
function Label({ value }: LabelProps) {
  const { id, name } = value;

  useEffect(() => {
    console.log('Effect 실행');
    // id와 name 사용
  }, [id, name]); // 객체 대신 개별 값 사용

  return <div>{name}</div>;
}
```

**해결 방법 2: useMemo로 객체 메모이제이션**

```typescript
function Parent() {
  const [count, setCount] = useState(0);
  
  // 객체를 메모이제이션
  const value = useMemo(() => ({
    id: '1',
    name: 'John'
  }), []); // 의존성이 변경되지 않으면 같은 객체 참조 유지

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>리렌더링</button>
      <Label value={value} />
    </div>
  );
}
```

**해결 방법 3: useCallback으로 함수 메모이제이션**

```typescript
function Parent() {
  const [userId, setUserId] = useState(1);

  // 함수를 메모이제이션
  const fetchUser = useCallback(async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  }, [userId]); // userId가 변경될 때만 새 함수 생성

  return <Child onFetch={fetchUser} />;
}

function Child({ onFetch }: { onFetch: () => Promise<User> }) {
  useEffect(() => {
    onFetch();
  }, [onFetch]); // onFetch가 변경될 때만 실행

  return <div>Child</div>;
}
```

### 4.7 경쟁 상태(Race Condition) 해결

비동기 작업에서 여러 요청이 동시에 발생하면 경쟁 상태가 발생할 수 있습니다.

```typescript
// ❌ 경쟁 상태 발생 가능
function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      setUser(data); // 이전 요청 결과가 나중에 도착하면?
    };

    fetchUser();
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

**해결 방법: cleanup 함수로 취소 플래그 사용**

```typescript
// ✅ 경쟁 상태 해결
function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isCancelled = false; // 취소 플래그

    const fetchUser = async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      
      // cleanup 후 응답이 도착하면 무시
      if (!isCancelled) {
        setUser(data);
      }
    };

    fetchUser();

    // cleanup 함수
    return () => {
      isCancelled = true; // 다음 effect 실행 전 취소 플래그 설정
    };
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

**AbortController 사용 (더 나은 방법)**

```typescript
function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          signal: abortController.signal
        });
        const data = await response.json();
        setUser(data);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('요청 취소됨');
        } else {
          console.error('에러 발생:', error);
        }
      }
    };

    fetchUser();

    return () => {
      abortController.abort(); // 진행 중인 요청 취소
    };
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

---

## 5. useLayoutEffect

`useLayoutEffect`는 `useEffect`와 유사하지만 **실행 시점**이 다릅니다.

### 5.1 타입 정의

```typescript
function useLayoutEffect(effect: EffectCallback, deps?: DependencyList): void;
```

### 5.2 실행 순서

```
1. 컴포넌트 렌더링
2. DOM 변경
3. useLayoutEffect 실행 (화면 업데이트 전)
4. 브라우저 화면 그리기 (paint)
5. useEffect 실행 (화면 업데이트 후)
```

### 5.3 사용 예시

**문제 상황: 깜빡임 발생**

```typescript
// ❌ useEffect 사용 - 깜빡임 발생
function Component() {
  const [name, setName] = useState('');

  useEffect(() => {
    // 서버에서 데이터를 가져오는 데 시간이 걸림
    const fetchName = async () => {
      const response = await fetch('/api/name');
      const data = await response.json();
      setName(data.name);
    };
    
    fetchName();
  }, []);

  return <div>안녕하세요, {name}님</div>;
  // 1. 처음에 "안녕하세요, 님" 렌더링 (깜빡임)
  // 2. name이 설정되면 "안녕하세요, John님" 렌더링
}
```

**해결: useLayoutEffect 사용**

```typescript
// ✅ useLayoutEffect 사용 - 깜빡임 없음
function Component() {
  const [name, setName] = useState('');

  useLayoutEffect(() => {
    // 화면에 그리기 전에 실행됨
    const fetchName = async () => {
      const response = await fetch('/api/name');
      const data = await response.json();
      setName(data.name);
    };
    
    fetchName();
  }, []);

  return <div>안녕하세요, {name}님</div>;
  // 처음부터 "안녕하세요, John님"으로 렌더링 (깜빡임 없음)
}
```

### 5.4 실용적인 사용 예시

**DOM 측정 및 조정**

```typescript
function Tooltip({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // DOM 요소의 크기와 위치 측정
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const parentRect = tooltipRef.current.parentElement?.getBoundingClientRect();
      
      if (parentRect) {
        setPosition({
          top: parentRect.bottom + 10,
          left: parentRect.left
        });
      }
    }
  }, [children]); // children이 변경되면 다시 측정

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left
      }}
    >
      {children}
    </div>
  );
}
```

### 5.5 사용 시 주의사항

1. **useLayoutEffect는 동기적으로 실행되어 브라우저 렌더링을 차단합니다.**
   - 무거운 작업은 피하세요.
   - 대부분의 경우 `useEffect`가 더 적합합니다.

2. **SSR 환경에서 경고 발생**
   - 서버에서는 `useLayoutEffect`가 실행되지 않습니다.
   - 필요하다면 조건부로 사용하세요.

```typescript
// SSR 환경 대응
import { useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function Component() {
  useIsomorphicLayoutEffect(() => {
    // SSR 환경에서는 useEffect로 동작
  }, []);
}
```

**사용 가이드:**
- **useEffect 사용**: 데이터 fetch, 구독, 이벤트 리스너 등 대부분의 경우
- **useLayoutEffect 사용**: DOM 측정, 스크롤 위치 조정, 깜빡임 방지가 필요한 경우

---

## 6. useMemo와 useCallback

`useMemo`와 `useCallback`은 성능 최적화를 위한 메모이제이션 Hook입니다.

### 6.1 타입 정의

```typescript
function useMemo<T>(factory: () => T, deps: DependencyList): T;
function useCallback<T extends Function>(callback: T, deps: DependencyList): T;
```

### 6.2 useMemo: 값 메모이제이션

**비싼 계산의 결과를 캐싱**합니다.

```typescript
import { useState, useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

function ProductList({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState('');

  // ❌ 최적화 없음: 매 렌더링마다 계산
  const expensiveTotal = products.reduce((sum, p) => sum + p.price, 0);

  // ✅ useMemo 사용: products가 변경될 때만 계산
  const total = useMemo(() => {
    console.log('총액 계산 중...');
    return products.reduce((sum, product) => sum + product.price, 0);
  }, [products]);

  // 필터링된 제품 목록도 메모이제이션
  const filteredProducts = useMemo(() => {
    console.log('필터링 중...');
    return products.filter(product =>
      product.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [products, filter]);

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="제품 검색"
      />
      <p>총액: {total}원</p>
      <ul>
        {filteredProducts.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

**실용적인 예시: 복잡한 데이터 변환**

```typescript
function DataVisualization({ rawData }: { rawData: number[] }) {
  // 복잡한 데이터 변환 작업
  const processedData = useMemo(() => {
    console.log('데이터 처리 중...');
    
    // 정렬, 그룹화, 통계 계산 등
    const sorted = [...rawData].sort((a, b) => a - b);
    const average = rawData.reduce((sum, val) => sum + val, 0) / rawData.length;
    
    return {
      sorted,
      average,
      min: Math.min(...rawData),
      max: Math.max(...rawData)
    };
  }, [rawData]);

  return (
    <div>
      <p>평균: {processedData.average}</p>
      <p>최소: {processedData.min}</p>
      <p>최대: {processedData.max}</p>
    </div>
  );
}
```

### 6.3 useCallback: 함수 메모이제이션

**함수의 참조를 보존**합니다.

```typescript
import { useState, useCallback } from 'react';

function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState('');

  // ❌ 최적화 없음: 매 렌더링마다 새 함수 생성
  const addTodo = () => {
    setTodos([...todos, input]);
    setInput('');
  };

  // ✅ useCallback 사용: todos가 변경될 때만 새 함수 생성
  const addTodoOptimized = useCallback(() => {
    setTodos(prev => [...prev, input]);
    setInput('');
  }, [input]); // input이 변경될 때만 함수 재생성

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={addTodoOptimized}>추가</button>
      <TodoItems todos={todos} />
    </div>
  );
}

// 자식 컴포넌트가 React.memo로 최적화되어 있을 때 효과적
const TodoItems = React.memo(({ todos }: { todos: string[] }) => {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>{todo}</li>
      ))}
    </ul>
  );
});
```

### 6.4 자식 컴포넌트에 함수 전달 시 최적화

```typescript
interface ChildProps {
  onItemClick: (id: number) => void;
}

// 자식 컴포넌트: React.memo로 감싸서 props가 변경될 때만 리렌더링
const Child = React.memo(({ onItemClick }: ChildProps) => {
  console.log('Child 렌더링');
  return (
    <button onClick={() => onItemClick(1)}>
      클릭
    </button>
  );
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 최적화 없음: 매번 새 함수이므로 Child가 항상 리렌더링됨
  const handleClick = (id: number) => {
    console.log('클릭:', id);
  };

  // ✅ useCallback 사용: Child는 count가 변경될 때만 리렌더링
  const handleClickOptimized = useCallback((id: number) => {
    console.log('클릭:', id, 'Count:', count);
  }, [count]);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
      <Child onItemClick={handleClickOptimized} />
    </div>
  );
}
```

### 6.5 useMemo vs useCallback

```typescript
// useMemo: 값을 반환
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// useCallback: 함수를 반환
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// useCallback은 useMemo의 축약형
const memoizedCallback = useMemo(() => {
  return () => doSomething(a, b);
}, [a, b]);
```

### 6.6 사용 시 주의사항

**1. 과도한 사용은 오히려 성능을 해칠 수 있습니다**

```typescript
// ❌ 불필요한 메모이제이션
function Component({ name }: { name: string }) {
  // 단순한 계산은 메모이제이션이 불필요
  const greeting = useMemo(() => `Hello, ${name}`, [name]); // 과도한 최적화
  
  // 이게 더 나음
  const greeting = `Hello, ${name}`;
}
```

**2. deps 배열 관리**

```typescript
function Component() {
  const [user, setUser] = useState({ name: 'John', age: 30 });

  // ❌ 객체를 deps에 직접 넣으면 참조 비교 문제 발생
  const greeting = useMemo(() => `Hello, ${user.name}`, [user]);

  // ✅ 필요한 값만 deps에 넣기
  const greeting = useMemo(() => `Hello, ${user.name}`, [user.name]);
}
```

**3. 메모이제이션이 필요한 경우**

- 연산 비용이 높은 계산
- 자식 컴포넌트로 전달되는 참조 타입 (객체, 배열, 함수)
- 의존성 배열에 들어가는 값

```typescript
// 메모이제이션이 효과적인 경우
function ExpensiveComponent({ data }: { data: number[] }) {
  // 1. 비싼 계산
  const sortedData = useMemo(() => {
    console.log('정렬 중...');
    return [...data].sort((a, b) => a - b);
  }, [data]);

  // 2. 자식 컴포넌트에 전달되는 함수
  const handleClick = useCallback((id: number) => {
    console.log('클릭:', id);
  }, []);

  return <ChildComponent data={sortedData} onClick={handleClick} />;
}
```

---

## 7. useRef

`useRef`는 두 가지 주요 용도로 사용됩니다:
1. **DOM 요소에 직접 접근**
2. **리렌더링되지 않는 값 저장**

### 7.1 타입 정의

```typescript
function useRef<T>(initialValue: T): MutableRefObject<T>;
function useRef<T>(initialValue: T | null): RefObject<T>;
function useRef<T = undefined>(): MutableRefObject<T | undefined>;

interface MutableRefObject<T> {
  current: T; // 변경 가능
}

interface RefObject<T> {
  readonly current: T | null; // 읽기 전용
}
```

### 7.2 DOM 요소 접근

```typescript
import { useRef, useEffect } from 'react';

function FocusInput() {
  // HTMLInputElement 타입 지정
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 마운트 시 자동 포커스
    inputRef.current?.focus();
  }, []);

  const handleClick = () => {
    // 버튼 클릭 시 포커스
    inputRef.current?.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={handleClick}>입력창에 포커스</button>
    </div>
  );
}
```

**다양한 DOM 요소 타입**

```typescript
const divRef = useRef<HTMLDivElement>(null);
const buttonRef = useRef<HTMLButtonElement>(null);
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

function MediaPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const play = () => {
    videoRef.current?.play();
  };

  const pause = () => {
    videoRef.current?.pause();
  };

  return (
    <div>
      <video ref={videoRef} src="/video.mp4" />
      <button onClick={play}>재생</button>
      <button onClick={pause}>정지</button>
    </div>
  );
}
```

### 7.3 스크롤 제어

```typescript
function ScrollToSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollToSection = () => {
    sectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div>
      <button onClick={scrollToSection}>해당 섹션으로 이동</button>
      
      <div style={{ height: '100vh' }}>스크롤 공간</div>
      
      <div ref={sectionRef} style={{ padding: '20px', background: 'lightblue' }}>
        <h2>여기가 목표 지점!</h2>
      </div>
    </div>
  );
}
```

### 7.4 리렌더링 없이 값 저장

`useRef`로 관리되는 값은 **변경되어도 컴포넌트가 리렌더링되지 않습니다**.

```typescript
function Component() {
  // useState: 값이 변경되면 리렌더링 발생
  const [count, setCount] = useState(0);
  
  // useRef: 값이 변경되어도 리렌더링 없음
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log('렌더링 횟수:', renderCount.current);
  });

  return (
    <div>
      <p>Count: {count}</p>
      <p>렌더링 횟수: {renderCount.current}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
    </div>
  );
}
```

**실용적인 예시: 이전 값 저장**

```typescript
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>현재: {count}</p>
      <p>이전: {prevCount}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
    </div>
  );
}
```

### 7.5 타이머와 인터벌 ID 저장

```typescript
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = window.setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const stop = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
    }
  };

  const reset = () => {
    stop();
    setSeconds(0);
  };

  useEffect(() => {
    // 언마운트 시 정리
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div>
      <p>경과 시간: {seconds}초</p>
      <button onClick={start} disabled={isRunning}>시작</button>
      <button onClick={stop} disabled={!isRunning}>정지</button>
      <button onClick={reset}>초기화</button>
    </div>
  );
}
```

### 7.6 자식 컴포넌트에 ref 전달: forwardRef

일반적으로 ref는 props로 전달할 수 없습니다. `forwardRef`를 사용해야 합니다.

```typescript
import { forwardRef, useRef } from 'react';

interface InputProps {
  label: string;
  placeholder?: string;
}

// forwardRef<ref 타입, props 타입>
const CustomInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, placeholder }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} placeholder={placeholder} />
      </div>
    );
  }
);

// 사용
function Parent() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <CustomInput ref={inputRef} label="이름" placeholder="이름을 입력하세요" />
      <button onClick={focusInput}>입력창 포커스</button>
    </div>
  );
}
```

### 7.7 useImperativeHandle: 노출할 메서드 제어

자식 컴포넌트에서 부모에게 노출할 메서드를 제어할 수 있습니다.

```typescript
import { forwardRef, useRef, useImperativeHandle } from 'react';

interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  reset: () => void;
}

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ src }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // 부모 컴포넌트에 노출할 메서드 정의
    useImperativeHandle(ref, () => ({
      play: () => {
        videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      reset: () => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.pause();
        }
      }
    }));

    return <video ref={videoRef} src={src} />;
  }
);

// 사용
function App() {
  const playerRef = useRef<VideoPlayerRef>(null);

  return (
    <div>
      <VideoPlayer ref={playerRef} src="/video.mp4" />
      <button onClick={() => playerRef.current?.play()}>재생</button>
      <button onClick={() => playerRef.current?.pause()}>정지</button>
      <button onClick={() => playerRef.current?.reset()}>처음부터</button>
    </div>
  );
}
```

### 7.8 MutableRefObject vs RefObject

```typescript
// 1. MutableRefObject: current를 자유롭게 변경 가능
const mutableRef = useRef<number>(0);
mutableRef.current = 10; // ✅ OK

// 2. RefObject: current가 readonly (DOM 요소에 사용)
const readonlyRef = useRef<HTMLDivElement>(null);
// readonlyRef.current = document.createElement('div'); // ❌ Error

// 실제 사용 예시
function Component() {
  // DOM 요소용: RefObject
  const divRef = useRef<HTMLDivElement>(null);
  
  // 값 저장용: MutableRefObject
  const countRef = useRef<number>(0);
  
  const handleClick = () => {
    countRef.current += 1; // ✅ 변경 가능
    console.log(countRef.current);
  };

  return (
    <div ref={divRef}>
      <button onClick={handleClick}>클릭</button>
    </div>
  );
}
```

---

## 8. 커스텀 훅 (Custom Hooks)

커스텀 훅은 컴포넌트 로직을 재사용 가능한 함수로 추출한 것입니다.

### 8.1 커스텀 훅의 규칙

1. **이름은 반드시 `use`로 시작**해야 합니다
2. **함수 컴포넌트나 다른 훅 내에서만** 호출할 수 있습니다
3. 훅의 규칙을 모두 따라야 합니다

### 8.2 기본 예시: useInput

```typescript
import { useState, useCallback, ChangeEvent } from 'react';

// 커스텀 훅 정의
function useInput(initialValue: string) {
  const [value, setValue] = useState(initialValue);

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return { value, onChange, reset };
}

// 사용
function LoginForm() {
  const email = useInput('');
  const password = useInput('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email:', email.value);
    console.log('Password:', password.value);
    
    // 폼 초기화
    email.reset();
    password.reset();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email.value}
        onChange={email.onChange}
        placeholder="이메일"
      />
      <input
        type="password"
        value={password.value}
        onChange={password.onChange}
        placeholder="비밀번호"
      />
      <button type="submit">로그인</button>
    </form>
  );
}
```

### 8.3 고급 예시: useAsync

비동기 작업을 쉽게 다루는 커스텀 훅입니다.

```typescript
import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  loading: boolean;
  data: T | null;
  error: Error | null;
}

function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [state, setState] = useState<AsyncState<T>>({
    loading: immediate,
    data: null,
    error: null
  });

  const execute = useCallback(async () => {
    setState({ loading: true, data: null, error: null });

    try {
      const response = await asyncFunction();
      setState({ loading: false, data: response, error: null });
      return response;
    } catch (error) {
      setState({
        loading: false,
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      });
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}

// 사용
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: number }) {
  const { loading, data, error, execute } = useAsync<User>(
    () => fetch(`/api/users/${userId}`).then(res => res.json()),
    true // 즉시 실행
  );

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>{data.name}</h2>
      <p>{data.email}</p>
      <button onClick={execute}>새로고침</button>
    </div>
  );
}
```

### 8.4 실용적인 커스텀 훅 예시

#### useLocalStorage

```typescript
import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  // 초기값을 localStorage에서 가져오기
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  // 값이 변경될 때 localStorage에 저장
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

// 사용
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  return (
    <div>
      <p>현재 테마: {theme}</p>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        테마 변경
      </button>
    </div>
  );
}
```

#### useDebounce

```typescript
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 사용
function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // API 호출
      console.log('검색:', debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="검색..."
    />
  );
}
```

#### useToggle

```typescript
import { useState, useCallback } from 'react';

function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return { value, toggle, setTrue, setFalse };
}

// 사용
function Modal() {
  const modal = useToggle(false);

  return (
    <div>
      <button onClick={modal.setTrue}>모달 열기</button>
      
      {modal.value && (
        <div>
          <h2>모달 내용</h2>
          <button onClick={modal.setFalse}>닫기</button>
        </div>
      )}
    </div>
  );
}
```

#### useWindowSize

```typescript
import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}

// 사용
function ResponsiveComponent() {
  const { width, height } = useWindowSize();

  return (
    <div>
      <p>창 크기: {width} x {height}</p>
      {width < 768 ? (
        <MobileView />
      ) : (
        <DesktopView />
      )}
    </div>
  );
}
```

---

## 9. 정리 및 Best Practices

### 9.1 Hook 사용 체크리스트

**✅ 해야 할 것:**

1. **타입을 명확하게 지정**
   ```typescript
   const [user, setUser] = useState<User | null>(null);
   ```

2. **의존성 배열을 정확하게 작성**
   ```typescript
   useEffect(() => {
     // effect
   }, [dep1, dep2]); // 실제로 사용하는 값만 포함
   ```

3. **정리 함수 작성**
   ```typescript
   useEffect(() => {
     const subscription = subscribe();
     return () => subscription.unsubscribe();
   }, []);
   ```

4. **커스텀 훅으로 로직 재사용**
   ```typescript
   const { data, loading } = useAsync(fetchData);
   ```

**❌ 하지 말아야 할 것:**

1. **조건부 Hook 호출**
   ```typescript
   if (condition) {
     useState(0); // ❌
   }
   ```

2. **의존성 배열 누락**
   ```typescript
   useEffect(() => {
     console.log(count); // count 사용하지만 deps에 없음
   }, []); // ❌
   ```

3. **과도한 메모이제이션**
   ```typescript
   const value = useMemo(() => a + b, [a, b]); // ❌ 불필요
   ```

### 9.2 성능 최적화 가이드

**측정 → 최적화 → 검증** 순서를 따르세요.

```typescript
// 1. 문제 파악: React DevTools Profiler 사용
// 2. 병목 지점 확인
// 3. 적절한 최적화 적용

// 최적화가 필요한 경우
function HeavyComponent({ data }: { data: number[] }) {
  // 비싼 계산
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a - b);
  }, [data]);

  // 자식에게 전달되는 함수
  const handleClick = useCallback((id: number) => {
    console.log(id);
  }, []);

  return <ChildComponent data={sortedData} onClick={handleClick} />;
}
```

### 9.3 타입스크립트 활용 팁

```typescript
// 1. 제네릭 활용
function useArray<T>(initialValue: T[]) {
  const [array, setArray] = useState<T[]>(initialValue);
  
  const push = (item: T) => {
    setArray(prev => [...prev, item]);
  };
  
  return { array, push };
}

// 2. 타입 가드 활용
function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'id' in data;
}

// 3. as const 활용
const [value, setValue] = useState(0);
return [value, setValue] as const; // 튜플 타입 유지
```


