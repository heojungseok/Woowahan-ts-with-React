# 리액트 훅

### 리액트 16.8이전

클래스 컴포넌트에서만 상태를 가질수 있었음.

`componentDidMount`,`componentDidUpdate`와 같이 하나의 상명주기 함수에서만 상태 업데이트에 따른 로직을 실행시킬 수 있었음.

**문제**

프로젝트규모가 커지면서,

1. 상태 업데이트 및 사이드 이펙트 처리 불편
2. 모든 상태를 하나의 함수 처리, 관심사가 뒤섞임.
3. 상태에 따른 테스트나 잘못 발생한 사이드 이펙트디버깅이 어려워짐.


## useState


### 상태 타입을 명시하지 않는다면,

상태타입을 명시하지 않으면 속성이 잘못된 내용을 넣는다면 에러를 잡지 못함

책에서는 agee를 예시로 들었는데

```ts
interface Member{
    name:string;
    age:number;
}

const MemeberList =()=>{
    const [members,setMembers] = useState<Member[]>([]);

    const sumAge = members.reduce((sum,member)=> sum + member.age,0)

    const addMember = () =>{
        setMembers([
            ...members,
            {
                name:"나",
                agee:12 // error
            }
        ])
    }

 return {
    //...
 }
}
```

## 의존성 배열을 사용하는 훅

### useEffect와 useLayoutEffect

1. useEffect

```tsx
function useEffect(effect:EffectCallback,deps?:DependencyList):void;

type DependencyList = ReadonlyArray<any>;
type EffectCallback = () => void | Destructor;

```
`EffectCallback`: Destructor 혹은 아무것도 반환하지 않는 함수.
- Promise타입은 반환하지 않으므로 useEffect의 콜백함수에는 비동기 함수가 들어갈 수 없음.
- 비동기를 호출하게 되면? race Condition을 불러 일으킴.

`Race Condition`: 멀티스레딩 환경에서 동시에 여러 프로세스나 스레드가 공유된 자원에 접근하려고 할때 발생할 수 있는 문제임. 이러한 상황에서 실행순사나 타이밍을 예측할 수 없게 되어 프로그램 동작이 원하지 않는 방향으로 흐를 수 있음.

내용은 이해했지만 어떤 예시가 있을까 해서 gemini가 알려준 예시

예시
---
useEffect가 비동기 함수를 허용해서 기다려준다고 칩시다. 이때 네트워크 응답 속도의 차이 때문에 심각한 버그가 생길 수 있습니다.

상황 예시: 사용자가 1번 페이지를 클릭했다가, 마음이 바뀌어 바로 2번 페이지를 클릭했습니다.

[요청 A] 1번 페이지 데이터 요청 (서버가 느려서 5초 걸림)

[요청 B] 2번 페이지 데이터 요청 (서버가 빨라서 1초 걸림)

[응답 B 도착] 화면에 2번 페이지 내용이 보여짐 (정상)

[응답 A 도착] 5초 뒤, 늦게 도착한 1번 요청이 끝남.

[문제 발생] 사용자는 2번 페이지에 있는데, 늦게 온 1번 데이터가 화면을 덮어씌움.

이처럼 **요청 순서(1->2)**와 **응답 완료 순서(2->1)**가 일치하지 않아 엉뚱한 데이터가 표시되는 현상을 **경쟁 상태(Race Condition)**라고 합니다.

useEffect 자체를 비동기로 만들면, 리액트가 이 "중간에 취소하거나 무시해야 하는 상황"을 제어하기가 매우 까다로워집니다.

---

`deps`:옵셔널, effect가 수행되기 위한 조건을 나열. 
- react는 deps가 변경됐는지, 얕은 비교로만 판단하기에 객체값이 바뀌지 않았더라도 객체의 참조값이 변경되면 콜백함수가 실행됨. 그래서, 실제로 사용하는 값을 deps로 사용해야함.

2. useLayoutEffect
```tsx
type DependencyList = ReadonlyArray<any>

function useLayoutEffect(effect:EffectCallback, deps?:DependencyList):void;
```

- useEffect와 차이점: 레이아웃배치와 화면 렌더링이 모두 완료된 후에 실행됨.

### useMemo와 useCallback

둘다, 이전에 생성된 값 혹은 함수를 기억하며, 동일한 값과 함수를 반복해서 생성하지 않게 하는 훅이다. (둘의 정의를 가장 완벽하고 짧게 얘기해서 좋다.)

```ts
type DependencyList = ReadonlyArray<any>

function useMemo<T>(factory: () => T, deps:DependencyList | undefined):T;
function useCallback<T extends (...args: any[]) => any>(callback:T, deps:DependencyList):T;
```

두 훅 모두 해당 의존성이 변경되면 다시 계산하게 된다.
불필요하게 사용되지 않게 사용에 유의해야하며, 과도한 메모이제이션은 컴포넌트 성능향상을 보장해주지 않는다.

### useRef
DOM을 직접 선택해야하는 경우 사용한다.

```
ex) <input/> 요소에 포커스 설정 , 특정 컴포넌트 위치로 스크롤 등 DOM을 직접 선택해야하는 경우.
```

`useRef`는 `MutableRefObject` 또는 `RefObject`를 반환.

1. MutableRefObject
- current값을 변경할 수 있음.
- 제네릭에 HTMLInputElement | null 타입을 넣어주었다면, 첫번째 타입정의
```tsx
function useRef<T>(initialValue:T):MutabelRefObject<T>
```
를 따를것.

이때 MutableObject의 current는 변경할 수 있는 값이 되어 ref.current값이 바뀌는 사이드 이펙트가 발생할 수 있다.


2. RefObject
- current는 readonly로 값을 변경 할 수 없다.
- 제네릭으로 HTMLInputElement, 인자에 null을 넣어 두번째 타입정의
```tsx
function useRef<T>(initialValue:T | null):RefObject<T>
```
를 따르게 된다. 이러면 RefObject를 반환하여 ref.current를 임의로 변경할 수 없게 된다.

### forwardRef

부모 컴포넌트에서 자식 컴포넌트의 DOM에 접근하고 싶을 때 사용한다.
기본적으로 `ref`는 props로 전달되지 않기 때문에, `forwardRef`로 감싸서 ref를 전달받아야 했다.

```tsx
// React 18 이전 방식
const MyInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// 부모 컴포넌트
const Parent = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  return <MyInput ref={inputRef} />;
};
```

### React 19에서의 변화 🎉

React 19(2024.12)부터는 `forwardRef` 없이 `ref`를 일반 props처럼 직접 전달할 수 있다!

```tsx
// React 19 방식 - forwardRef 불필요!
const MyInput = ({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> }) => {
  return <input ref={ref} {...props} />;
};
```

> 기존 `forwardRef`도 여전히 동작하지만, 향후 deprecated 될 예정이므로 새 프로젝트에서는 props로 직접 전달하는 방식을 권장한다.

### useImperativeHandle

부모에게 전달받은 ref를 통해 자식 컴포넌트 내부의 특정 함수만 노출하고 싶을 때 사용합니다.

### useRef의 여러가지 특성

자식 컴퍼넌트를 변수로 저장하는거로 활용. 그 외에 다른것으로도 사용.

- useRef로 관리되는 변수는 값이 바뀌어도 컴포넌트의 리렌더링이 발생하지 않는다.
- 리액트 컴퍼넌트의 상태는 상태변경함수를 호출 후 렌더링 이후 업데이트된 상태를 조회할수 있지만, useRef로 관리되는 변수는 값을 설정한 후 즉시 조회가 가능하다.

## 커스텀 훅

### 나만의 훅 만들기

**규칙**

1. 반드시 use로 시작해야함.
2. 반드시 컴포넌트 내에서 사용해야함.

### 타입스크립트로 커스텀 훅 강화하기

매개변수와 반환값의 타입을 명확히 지정하여 사용하는 쪽에서 타입 추론이 가능하도록 합니다. 특히 이벤트 핸들러에는 ChangeEvent`<HTMLInputElement>` 같이 구체적인 타입을 명시하는 것이 좋습니다.



