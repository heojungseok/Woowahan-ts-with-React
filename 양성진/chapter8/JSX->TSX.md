# JSX에서 TSX로

## 헷갈릴수 있는 리액트 컴포넌트의 타입

### 클래스 컴포넌트

```ts
interface Component<P ={}, S={}, SS=any> extends ComponentLifecycle<P,S,SS>{}

class Component<P,S> {
 /*... 생략 */

class PureComponent<P = {}, S = {}, SS = any> extends Component<P,S,SS>{}
}
```

P는 props, S는 state고 이건 클래스형 컴포넌트를 타입스크립트에서 어떻게 정의하고 있는지 보여주는 내부 코드입니다.


```ts
interface WelcomeProps{
    name:string;
}

class Welcome extends React.Component<WelcomeProps>{
     /*... 생략 */
}
```

예시를 보면 props와 state 타입을 제네릭으로 받고 있음.

### 함수 컴포넌트 타입

```ts
type WelcomeProps = {
  name: string;
  children?: React.ReactNode;

const Welcome: React.FC<WelcomeProps> = ({ name, children }) => {
  return <div>{name} {children}</div>;
};

// 방법 2: 반환 타입 명시 (가장 직관적)
const Welcome = ({ name }: WelcomeProps): JSX.Element => {
  return <div>{name}</div>;
};
```
React.FC 혹은 React.VFC로 타입을 지정함. 저 둘은 리액트에서 함수 컴포넌트의 타입 지정을 위해 제공되는 타입입니다. FC는 FunctionComponent의약자고, 리액트 18버전 이후에는 VFC는 삭제됨


### children props 타입 지정

```ts
type PropsWithChildren<P> = P & { children?： ReactNode ； undefined };
```

children은 뭐든 다 받을수 있음. 
구체적인걸 받고자 한다면 구체적으로 타입을 직접 지정하면 됨.

```ts
type WelcomeProps = {
  // 오직 이 4가지 문자열 중 하나만 넣을 수 있음!
  children: "천생연분" | "더 귀한 분" | "귀한 분" | "고마운 분";
};
```

### render 메서드와 함수 컴포넌트의 반환 타입 - React.ReactElement vs JSX.Element vs React.ReactNode


### 포함 관계

> ReactNode > ReactElement > JSX.Element
> 
1. **ReactElement**: `React.createElement`가 반환하는 객체 형태 (`type`, `props`, `key`를 가짐).
2. **ReactNode**: **render 할 수 있는 모든 것**. `ReactElement` + 원시 타입(`string`, `number`, `boolean`, `null`, `undefined`)을 포함.
3. **JSX.Element**: `ReactElement`를 상속받으며, props와 type이 `any`인 제네릭 타입. 리액트 엘리먼트를 유연하게 표현.