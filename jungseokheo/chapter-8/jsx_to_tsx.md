# 리액트 컴포넌트 타입

#### 클래스 컴포넌트 타입

```ts
// Component - 기본형
interface Component<P = {}, S = {}, SS = any> extends ComponentLifecycle<P, S, SS> {}

// PureComponent - Component를 상속받은 최적화 버전
class PureComponent<P = {}, S = {}, SS = any> extends Component<P, S, SS> {}


interface WelcomeProps {
  name: string;
}

class Welcome extends React.Component<WelcomeProps> {
  // <WelcomeProps>로 P 타입을 명시했으니
  // this.props.name을 안전하게 사용 가능!
}


interface MyState {
  count: number;
}

class Counter extends React.Component<{}, MyState> {
  // 첫 번째 {} : props 없음
  // 두 번째 MyState : state 타입 명시
  // 이제 this.state.count를 안전하게 사용!
}

```
클래스 컴포넌트를 만들 때 "이 컴포넌트는 어떤 `props`를 받고, 어떤 `state`를 가질지" 제네릭으로 타입을 명시해서 타입 안정성을 확보하는 방법.

#### 함수 컴포넌트 타입

React v18부터는 함수 컴포넌트 작성 방식이 바뀜. `children`이 필요하면 직접 명시하고, React.FC 대신 직접 타입을 지정하는 방식도 고려.
(React.VFC는 사라졌고, children은 필요할 때만 props에 직접 추가하면 된다!)

```ts
// 1. children 필요하면 직접 명시
interface WelcomeProps {
  name: string;
  children?: React.ReactNode;  // 직접 추가!
}

const Welcome: React.FC<WelcomeProps> = ({ name, children }) => {
  return <div>{name}{children}</div>;
};

// 2. children 없으면 그냥 안 넣으면 됨
interface GreetingProps {
  name: string;
}

const Greeting: React.FC<GreetingProps> = ({ name }) => {
  return <div>{name}</div>;
};

// 3. 또는 타입 직접 지정 (React.FC 안 쓰기)
const Greeting = ({ name }: GreetingProps): JSX.Element => {
  return <div>{name}</div>;
};
```

#### Children props 타입 지정

```ts

interface WelcomeProps {
  name: string;
}

// 이렇게 쓰면 자동으로 children이 추가됨
const Welcome: React.FC<PropsWithChildren<WelcomeProps>> = ({ name, children }) => {
  return <div>{name}{children}</div>;
};

```

```ts
// ReactNode는 이런 것들을 모두 포함해요
type ReactNode = 
  | ReactElement      // <div>안녕</div>
  | string           // "안녕"
  | number           // 123
  | boolean          // true/false
  | null
  | undefined;
```

ReactNode는 범위가 너무 넓다. 뭐든 다 받을 수 있어 타입 안정성이 약함.
그래서 아래와 같은 예시로 사용을 해야한다.

1. 특정 문자열 허용
```ts

type WelcomeProps = {
  children: "천생연분" | "더 귀한 분" | "귀한 분" | "고마운 분";
};

const Welcome = ({ children }: WelcomeProps) => {
  return <div>{children}</div>;
};

// ✅ 가능
<Welcome>천생연분</Welcome>

// ❌ 에러 - "안녕하세요"는 허용 안 됨
<Welcome>안녕하세요</Welcome>

```

2. 모든 문자열 허용
```ts

type WelcomeProps = {
  children: string;
};

const Welcome = ({ children }: WelcomeProps) => {
  return <div>{children}</div>;
};

// ✅ 가능
<Welcome>아무 문자열</Welcome>

// ❌ 에러 - 숫자나 JSX는 안 됨
<Welcome>123</Welcome>
<Welcome><span>태그</span></Welcome>

```
3. JSX 엘리먼트만 허용
```ts

type WelcomeProps = {
  children: ReactElement;
};

const Welcome = ({ children }: WelcomeProps) => {
  return <div>{children}</div>;
};

// ✅ 가능
<Welcome><span>안녕</span></Welcome>

// ❌ 에러 - 문자열은 안 됨
<Welcome>안녕</Welcome>

```


### render 메서드와 함수 컴포넌트의 반환 타입 - React.ReactElement vs JSX.Element vs React.ReactNode

* ReactElement 타입은 리액트 컴포넌트를 객체 형태로 저장하기 위한 포맷.

* JSX.Element 타입은 ReactElement를 확장하고 있음, 글로벌 네임스페이스에 정의되어 있어 외부 라이브러리에서 컴포넌트 타입을 재정의 할 수 있는 유연성을 제공하여 컴포넌트 타입을 재정의하거나 변경이 용이.

```
┌─────────────────────────────────────────────────────────┐
│                      ReactNode                          │
│  (가장 넓은 타입 - React가 렌더링할 수 있는 모든 것)      │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │            ReactElement                       │    │
│  │   (React.createElement()의 반환 타입)         │    │
│  │                                               │    │
│  │   ┌─────────────────────────────────┐        │    │
│  │   │      JSX.Element                │        │    │
│  │   │  (JSX 문법의 반환 타입)         │        │    │
│  │   │                                 │        │    │
│  │   │  <div>Hello</div>               │        │    │
│  │   │  <MyComponent />                │        │    │
│  │   └─────────────────────────────────┘        │    │
│  │                                               │    │
│  │  React.createElement('div', null, 'Hello')   │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  string: "안녕하세요"                                   │
│  number: 123                                           │
│  boolean: true, false                                  │
│  null                                                  │
│  undefined                                             │
│  ReactFragment                                         │
│  ReactPortal                                           │
└─────────────────────────────────────────────────────────┘

```

* 타입 정의
```ts
// 가장 좁음
type JSX.Element = ReactElement<any, any>

// 중간
interface ReactElement<P = any, T = string | JSXElementConstructor<any>> {
  type: T;
  props: P;
  key: Key | null;
}

// 가장 넓음
type ReactNode = 
  | ReactElement        // JSX.Element 포함
  | string
  | number
  | ReactFragment
  | ReactPortal
  | boolean
  | null
  | undefined;

```

* ReactElement

`JSX는 리액트 엘리먼트를 생성하기 위한 문법`

JSX의 createElement 메서드 호출로 생성된 리액트 엘리먼트를 나타내는 타입.

* ReactNode

ReactChild 외에도 boolean, null, undefined 등 훨씬 넓은 범주의 타입을 포함. 리액트의 render 함수가 반환할 수 있는 모든 형태

> ReactChild: ReactElement | string | number로 정의되어 ReactElement보다는 좀 더 넓은 범위를 가짐.

* JSX.Element

ReactElement의 특정 타입으로 props와 타입 필드를 any로 가지는 타입이라는 것

#### 리액트메서 기본 HTML 요소 타입 활용하기

* DetailedHTMLProps: HTML 요소의 전체 속성 (ref 포함, 복잡함)
* ComponentPropsWithoutRef: HTML 요소의 속성 (ref 제외, 간단함, 권장!)

* 버튼 같은 컴포넌트를 따로 만드는 이유

1. 디자인 시스템 통일
2. 공통 기능 추가
3. 타입 안정성 + 기본 HTML 속성 활용

실무에서 자주 쓰는 패턴

```ts
type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

const Button = ({ variant = 'primary', loading, ...props }: ButtonProps) => {
  return <button {...props} disabled={loading || props.disabled} />;
};

```

* HTML 요소 생성 기준 

**만든다:**
- 자주 재사용되는 것
- 스타일이 통일되어야 하는 것
- 공통 동작이 필요한 것 (로딩, 에러 처리 등)
- 디자인 시스템에 포함되는 것

**안 만든다:**
- 레이아웃용 태그 (div, section, article)
- 텍스트 태그 (p, span, h1~h6)
- 단순 구조용 태그 (ul, li)
- 커스터마이징 필요 없는 것


#### ref를 props로 받을 경우 고려 사항

클래스 컴포넌트와 함수 컴포넌트에서 ref를 props로 받아 전달하는 방식에 차이 존재.
forwardRef로 감싸면 클래스 인스턴스로 인식 되는 것이 아닌 ref를 전달하는 통로를 생성해주는 것.
ref는 여전히 DOM 요소를 가리키고 있다.

||클래스 컴포넌트|함수+forwardRef|
|-|-|-|
|ref 필요성|자동지원|forwardRef 필요|
|ref 가리키는 것|클래스 인스턴스|DOM 요소|
|사용 가능한 것|클래스 메서스|DOM API|

# 타입 스크립트로 리액트 컴포넌트 만들기

#### 리액트 이벤트

1. 리액트 이벤트는 브라우저 이벤트와 다르다.
: 리액트는 자체적으로 이벤트를 관리하기 때문에 표기법이 다름.

```html
<!-- 소문자 -->
<button onclick="handleClick()">클릭</button>
```

```ts
// 카멜케이스
<button onClick={handleClick}>클릭</button>
```

2. 이벤트 버블링 vs 캡처
: 캡처를 쓰려면 이름 뒤에 `Capture`를 붙임.

```ts
/** 기본 (버블링 단계) */
// 자식 → 부모로 전파
<div onClick={handleDivClick}>
  <button onClick={handleButtonClick}>클릭</button>
</div>

// 실행 순서: handleButtonClick → handleDivClick

/** 캡처 단계 */
// 부모 → 자식으로 전파
<div onClickCapture={handleDivClick}>
  <button onClickCapture={handleButtonClick}>클릭</button>
</div>

// 실행 순서: handleDivClick → handleButtonClick

```

3. 합성 이벤트 (SyntheticEvent)
: 리액트가 브라우저 이벤트를 **포장(합성)**해서 더 좋은 타입을 제공. 평소처럼 이벤트 핸들러를 작성하면 리액트 안에서 자동으로 쓰임.

* 타입 안정성
* 브라우저 간 일관성
* 자동완성

위 3가지의 장점이 존재.

```ts
// 브라우저 네이티브 이벤트
const eventHandler1: GlobalEventHandlers["onchange"] = (e) => {
  e.target;  // ❌ 타입이 EventTarget - target 속성이 없음!
};
// 리액트 합성 이벤트
const eventHandler2: ChangeEventHandler = (e) => {
  e.target;  // ✅ 타입이 HTMLSelectElement - target 사용 가능!
};
```
#### 공변성과 반공변성

**타입의 넓고 좁음**

좁은 타입 → 넓은 타입 할당은 항상 가능

```ts
type Animal = { name: string };
type Dog = { name: string; bark: () => void };

// Dog은 Animal보다 좁은(구체적인) 타입
// Dog는 Animal의 서브타입

let animal: Animal = { name: "동물" };
let dog: Dog = { name: "멍멍이", bark: () => console.log("왈왈") };

animal = dog;  // ✅ OK - Dog는 Animal보다 좁음
dog = animal;  // ❌ 에러 - Animal은 bark가 없음

```

* 공변성: "같은 방향으로 변한다."

타입을 사용하는 구조도 같은 방향으로 변할 수 있음.

```ts
//배열 예시
type Animal = { name: string };
type Dog = { name: string; bark: () => void };

let animals: Animal[] = [];
let dogs: Dog[] = [{ name: "멍멍이", bark: () => {} }];

animals = dogs;  // ✅ 공변성! Dog[] → Animal[] 가능
// Dog가 Animal보다 좁으니까, Dog[]도 Animal[]보다 좁음

// 함수 반환 타입
animals = dogs;
animals[0].name;  // ✅ Dog에도 name 있음 - 안전!

type GetAnimal = () => Animal;
type GetDog = () => Dog;

let getAnimal: GetAnimal;
let getDog: GetDog = () => ({ name: "멍멍이", bark: () => {} });

getAnimal = getDog;  // ✅ 공변성!
// Dog를 반환하는 함수를 Animal 반환하는 함수로 취급 가능
```

* 반공변성: "반대 방향으로 변한다."

함수의 매개변수 타입은 반공변적.

```ts

type Animal = { name: string };
type Dog = { name: string; bark: () => void };

type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

let animalHandler: AnimalHandler = (animal) => {
  console.log(animal.name);  // name만 사용
};

let dogHandler: DogHandler = (dog) => {
  console.log(dog.name);
  dog.bark();  // bark도 사용
};

// 여기가 핵심!
dogHandler = animalHandler;  // ✅ 반공변성!
// Animal 받는 함수를 Dog 받는 함수로 취급 가능
// 나중에 Dog를 전달할 때
const myDog: Dog = { name: "멍멍이", bark: () => {} };
dogHandler(myDog);  
// animalHandler는 name만 쓰니까 안전! ✅

//더 넓은 타입(Animal)을 받는 함수를, 더 좁은 타입(Dog)을 받는 함수로 취급
```