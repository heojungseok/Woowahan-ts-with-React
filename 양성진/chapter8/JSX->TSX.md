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

### 활용하기

**ReactElement**

JSX가 createElement 메서드를 호출하기 위한 문법이다. 리액트 엘리먼트를 생성하기 위한 문법이며 
트랜스파일러는 JSX문법을 createElement 메서드 호출문으로 변환하여 리액트 엘리먼트를 생성.
`React.createElement`가 반환하는 객체 형태 (`type`, `props`, `key`를 가짐).
createElement 메서드 호출로 생성된 리액트 엘리먼트를 나타내는 타입.

```ts
const Wrapper = ({ element }: { element: React.ReactElement }) => {
  return <div>{element}</div>;
};
```


**ReactNode**

ReactChild는 ReactElement | string | number로 타입이 정의되어 ReactElement보단 좀 더 넓은 범위를 가지고 있다는게 특징이다.
ReactNode는 **render 할 수 있는 모든 것**. `ReactElement` + 원시 타입(`string`, `number`, `boolean`, `null`, `undefined`)을 포함.

```ts
const Container = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};
// 사용: <Container>텍스트</Container> 또는 <Container><Button /></Container>
```

**JSX.Element**

 `ReactElement`를 상속받으며, props와 type이 `any`인 제네릭 타입. 리액트 엘리먼트를 유연하게 표현.

```ts
const Button = (): JSX.Element => {
  return <button>클릭</button>;
};
```


### 리액트에서 기본 html 요소 타입 활용하기 (DetailedHTMLProps 와 ComponentWithoutRef)

HTML 속성을 활용하는 대표적인 두가지 방법은 DetailedHTMLProps 와 ComponentWithoutRef이 있다.

**DetailedHTMLProps**
```ts

type AddButtonProps = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

type ButtonProps = {
  onClick:AddButtonProps['onClick']
}
```
HTML button의 onclick 이벤트 헨들러타입과 동일하게 할당되는것을 확인할 수 있음.


**ComponentWithoutRef**



```ts
type AddBoardButtonProps = React.ComponentPropsWithoutRef<'button'>

type ButtonProps = {
  onClick:AddBoardButtonProps['onClick']
}
```

**왜 ComponentPropsWithoutRef를 써야 할까요?**

**1. ref 전달의 기본 제약 사항**

클래스 컴포넌트: ref를 props로 전달받아 내부 DOM 요소에 직접 전달할 수 있습니다.

함수 컴포넌트: 기본적으로는 ref를 props로 전달받아도 

**내부 DOM 요소에 전달(Forwarding)** 하는 것이 불가능합니다. 함수 컴포넌트는 인스턴스를 생성하지 않기 때문에 ref 객체에 기대한 DOM 노드 값이 할당되지 않습니다.

**2. forwardRef를 통한 해결**

역할: 함수 컴포넌트에서 ref를 props로 전달받아 내부 DOM 요소에 연결할 수 있도록 도와주는 React의 특별한 메서드입니다.

Props 분리: forwardRef는 컴포넌트 함수를 (props, ref) => { ... }의 형태로 받습니다. 즉, ref는 props 객체와 분리되어 별도의 인자로 전달됩니다.

**3. ComponentPorpsWithoutRef 사용의 필요성**

문제: DetailedHTMLProps나 ComponentPropsWithRef 같은 기존 HTML 속성 타입은 이미 ref 속성을 포함하고 있습니다.

충돌: forwardRef를 사용하는 함수 컴포넌트의 경우, ref는 별도의 두 번째 인자로 전달되는데, 만약 Props 타입에 ref가 포함되어 있으면 "Props에도 ref가 있고, 인자에도 ref가 있는" 이중 타입 충돌이 발생합니다.

해결: ComponentPropsWithoutRef<'tag'>는 해당 태그가 가질 수 있는 모든 HTML 속성(예: onClick, className, disabled 등)은 포함하되, 오직 ref 속성만 제외합니다.

따라서, 함수 컴포넌트의 Props를 정의할 때는 ref를 Props에서 제외시켜 forwardRef의 두 번째 인자인 ref가 타입을 전담하도록 하여 쓸데없는 타입 오류를 방지하고 안전한 타입 정의를 달성할 수 있습니다.


## 타입스크립트로 리액트 컴포넌트 만들기

책에서 Select컴퍼넌트를 예시로 들면서 설명합니다.

```jsx
// 컴포넌트 선언 시 제네릭 <OptionType> 정의
const Select = ({
  options,
  selectedOption,
  onChange,
}) => {
  // 구현 생략...
};
```
타입으로 셀렉트 옵션값들과 선택된 옵션, 핸들러함수를 type으로 받습니다.

### JSDocs로 일부 타입 지정하기
컴퍼넌트의 설명과 각 속성이 어떤 역할 하는지 간단히 알려줄수 있음.
```ts
/**
 * Select 컴포넌트
 * @params {Object} props - Select 컴퍼넌트로 넘겨주는 속성
 * @params {Object} props.options - {[key:stirng]:stirng} 형식으로 이루어진 어쩌구 저쩌구
 */

const Select = //....
```

어떤 객체가 들어올지 몰라 에러 발생 가능성 높음.

### props 인터페이스 작성

```ts

type Option = Recorckstring, string>; // {[key： string]： string}
interface SelectProps {
  options： Option;
  selectedOption?： string;
  onChange?： (selected?： string) => void;
}
const Select == ({ options, selectedOption, onChange }： SelectProps)： JSX.Element =>{}
```

### 리액트 이벤트

리액트는 가상돔을 다루면서 이벤트도 별도로 관리한다.

컴포넌트에 등록되는 이벤트는 카멜케이스로 표기된다. (onClick,onChange)

컴포넌트에 연결할 이벤트 핸들러는 
`React.ChangeEventHandler<HTMLSelectElement>` 처럼, 해당 DOM 요소 타입에 맞는 정확한 타입을 명시해야 합니다.


### 훅에 타입 추가하기

타입스크릷트의 **제네릭**을 활용하여 훅과 컴퍼넌트 Props의 타입을 명확하게 지정하여 한정된 타입으로만 다룰수있게 강제할수 있다.

```ts

const fruits ={
  apple:'사과',
  banana:'바나나',
  kiwi:'키위'
}
type Fruit = keyof typeof fruits; 

const [fruit,changeFruit] = useState<Fruit | undefined>("apple")
```
useState()처럼 초깃값 없이 호출하면 undefined로 추론되어 나중에 string을 할당하면 오류가 발생. 
`useState("apple")`처럼 string으로 추론되면 'orange'와 같이 예상치 못한 문자열 할당을 막을 수 없음.

그래서 명확하게 유니온타입을 지정해서 넣어줘야함.
### 제네릭 컴퍼넌트 만들기

문제:changeFruit는 매개변수 Fruit는 props로 전달되어야 하지만 onChange 매개변수 string보다 좁기에 타입에러가 발생함.

-> 제한된 키 값만 가지도록 하려면?

제네릭을 사용한 컴퍼넌트를 만들수 있다. 그 자체를 제네릭으로 만들어보자


```ts
const Select = <OptionType extends Record<string, string>>({ /* ... */ }) => { ... };


interface SelectProps<OptionType> {
    // keyof OptionType을 사용하여 selectedOption을 제한된 키값만 허용하도록 만듦
    selectedOption?: keyof OptionType; 
    onChange?: (selected?: keyof OptionType) => void;
}
```

컴포넌트에 전달되는 options Prop의 타입(fruits 객체)을 기반으로 OptionType이 추론되어, selectedOption에 유효하지 않은 키값("orange")을 전달하면 즉시 타입 에러가 발생합니다.



### 타입스크립트의 변성(Variance)
변성(Variance)은 한 타입(A)이 다른 타입(B)의 서브타입일 때, 이들을 포함하는 더 복잡한 타입(`T<A>`, `T<B>`)의 상속 관계가 어떻게 결정되는지를 정의합니다.

1. 공변성 (Covariance: 같이 변함)
일반적인 타입이나 함수의 반환값에서 나타나는 성질입니다. 상속 관계가 같은 방향으로 흐릅니다.

정의: 타입 $\text{A}$가 타입 $\text{B}$의 서브타입일 때, $\text{T}$도 $\text{T}$의 서브타입이 됩니다. ($\text{A} \subset \text{B} \implies \text{T} \subset \text{T}$)

쉬운 이해: 좁은 타입을 넓은 타입의 자리에 할당할 수 있습니다.

예시: Member는 User보다 좁은 타입입니다. Array<Member>는 Array<User>에 할당 가능합니다.

```tsx
interface User { id: string; }
interface Member extends User { nickName: string; } // Member는 User의 서브타입 (좁음)

let users: Array<User> = [];
let members: Array<Member> = [];

users = members; // OK. 좁은 타입(Member)을 넓은 타입(User)의 배열에 넣는 것은 안전함.
members = users; // Error. 넓은 타입(User)에는 nickName이 없을 수 있으므로 위험함.

```


### 2. 반공변성 (Contravariance: 반대로 변함)

함수의 매개변수 타입에서 나타나는 성질입니다. 상속 관계가 반대 방향으로 흐릅니다.

정의: 타입 $\text{A}$가 타입 $\text{B}$의 서브타입일 때, $\text{T}$가 $\text{T}$의 서브타입이 됩니다. ($\text{A} \subset \text{B} \implies \text{T} \subset \text{T}$)

쉬운 이해: 매개변수가 넓은 타입인 함수를 매개변수가 좁은 타입인 변수에 할당하는 것이 안전합니다.

🎯 함수 타입에서의 안전성 원칙
함수 타입에서 반공변성을 띠는 이유는 호출 안전성 때문입니다.

1. 좁은 함수 (PrintMember): (user: Member) => void

Member 타입 객체가 들어올 것을 기대하며 nickName까지 사용합니다.

2. 넓은 함수 (PrintUser): (user: User) => void

User 타입 객체만 처리할 수 있으며, nickName은 사용하지 않습니다.

```ts
type PrintUserInfo<U extends User> = (user: U) => void;

let printUser: PrintUserInfo<User> = (user) => console.log(user.id); // 넓은 타입의 매개변수
let printMember: PrintUserInfo<Member> = (user) => console.log(user.id, user.nickName); // 좁은 타입의 매개변수

// 할당: printMember = printUser
printMember = printUser; // OK. 
// 이유: printUser(넓은 함수)는 Member 객체(좁은 객체)를 받아도 id만 사용하므로 안전함.
//       (넓은 함수는 좁은 객체를 처리할 수 있음)

// 할당: printUser = printMember
printUser = printMember; // Error. 
// 이유: printMember(좁은 함수)를 printUser 자리에 할당하면,
//       나중에 이 자리에 User 객체(넓은 객체)가 들어올 수 있는데, 
//       printMember는 User 객체에 없는 nickName을 사용하려고 시도할 수 있으므로 위험함.
//       (좁은 함수는 넓은 객체를 처리할 수 없음)
```

### 3. React 이벤트 핸들러와 변성 (Variance)

타입스크립트의 --strict 모드에서 함수 타입을 정의하는 방식에 따라 변성(공변성/반공변성)이 달라져 타입 에러 발생 여부가 결정됩니다.



정의 방식 | 변성 | 안전성
| --- | --- | --- |
| 화살표 함수 표기법 (onChangeA) | 반공변성 (권장) | 좁은 타입의 함수를 넓은 타입 자리에 할당하는 것을 제한하여 안전한 코드만 허용 |
| 일반 함수 표기법 (onChangeB) | 이변성 (Bivariance) | 반공변성 원칙을 무시하고 할당을 허용 (레거시 JS 호환 목적) |



권장 사항: 특별한 경우가 아니라면 **반공변적인 함수 타입 (화살표 함수 표기법)**을 사용하는 것이 타입 안정성 측면에서 항상 권장됩니다.