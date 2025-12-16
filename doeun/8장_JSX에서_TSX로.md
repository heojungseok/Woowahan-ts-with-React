# 8장 JSX에서 TSX로

## 1. 리액트 컴포넌트의 타입

### 1.1 클래스 컴포넌트 타입

```typescript
interface Component<P = {}, S = {}, SS = any> 
  extends ComponentLifecycle<P, S, SS> {}

class Component<P, S> {
  /* ... */
}

class PureComponent<P = {}, S = {}, SS = any> 
  extends Component<P, S, SS> {}
```

클래스 컴포넌트는 `React.Component` 또는 `React.PureComponent`를 상속받아 구현합니다. 제네릭 타입 매개변수는 다음을 의미합니다
- **P**: Props 타입
- **S**: State 타입
- **SS**: Snapshot 타입 (getSnapshotBeforeUpdate 사용 시)

```typescript
interface WelcomeProps {
  name: string;
}

interface WelcomeState {
  count: number;
}

// Props와 State 타입 지정
class Welcome extends React.Component<WelcomeProps, WelcomeState> {
  state = { count: 0 };
  
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}
```

> **참고**: 현재는 함수 컴포넌트와 Hooks를 사용하는 것이 더 권장됩니다.

---

### 1.2 함수 컴포넌트 타입

함수 컴포넌트의 타입을 지정하는 방법은 여러 가지가 있습니다:

```typescript
interface WelcomeProps {
  name: string;
}

// 1. 함수 선언 방식
function Welcome(props: WelcomeProps): JSX.Element {
  return <h1>Hello, {props.name}</h1>;
}

// 2. 함수 표현식 - React.FC 사용
const Welcome: React.FC<WelcomeProps> = ({ name }) => {
  return <h1>Hello, {name}</h1>;
};

// 3. Props와 반환 타입을 직접 지정
const Welcome = ({ name }: WelcomeProps): JSX.Element => {
  return <h1>Hello, {name}</h1>;
};
```

**React.FC의 역사와 변화**

```typescript
// React 18 이전
type FC<P = {}> = FunctionComponent<P>;

interface FunctionComponent<P = {}> {
  (props: PropsWithChildren<P>, context?: any): ReactNode;
  // children이 암묵적으로 포함됨
}

// React 18 이후
interface FunctionComponent<P = {}> {
  (props: P, context?: any): ReactNode;
  // children이 제거됨
}
```

**주요 변경사항:**
- React 16.9.4에서 `React.VFC` 추가 (children 없는 버전)
- React 18에서 `React.VFC` 삭제
- React 18에서 `React.FC`에서 children 제거

따라서 **React 18 이후**에는:
- `React.FC` 사용 (children 필요시 명시적 추가)
- Props와 반환 타입을 직접 지정하는 방식 사용

---

### 1.3 Children Props 타입 지정

children을 사용해야 하는 경우 다음과 같이 타입을 지정합니다:

```typescript
// 1. PropsWithChildren 유틸리티 타입 사용
type PropsWithChildren<P = unknown> = P & {
  children?: ReactNode | undefined;
};

interface MyProps {
  title: string;
}

type MyComponentProps = PropsWithChildren<MyProps>;

const MyComponent = ({ title, children }: MyComponentProps) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
};

// 2. children 타입을 구체적으로 제한
interface WelcomeProps {
  name: string;
  children: '최고' | '좋음' | '보통'; // 특정 문자열만 허용
}

const Welcome = ({ name, children }: WelcomeProps) => {
  return <h1>{name}님은 {children} 등급입니다</h1>;
};

// 3. JSX 요소만 허용
interface ContainerProps {
  children: ReactElement; // JSX 요소만
}

// 4. 문자열만 허용
interface TextProps {
  children: string;
}
```

**ReactNode가 허용하는 타입들:**
- ReactElement (JSX 요소)
- string
- number
- boolean
- null
- undefined
- 배열

---

### 1.4 반환 타입: ReactElement vs JSX.Element vs ReactNode

리액트 컴포넌트의 반환 타입으로 사용되는 세 가지 타입의 차이를 이해하는 것이 중요합니다.

#### ReactElement

```typescript
interface ReactElement
  P = any,
  T extends string | JSXElementConstructor<any> = 
    string | JSXElementConstructor<any>
> {
  type: T;      // 엘리먼트 타입 (예: 'div', 'h1')
  props: P;     // 속성
  key: string | null;
}
```

**ReactElement는 React 엘리먼트 객체의 구조**를 나타냅니다:

```typescript
// JSX 문법
const element = <h1 className="greeting">Hello, world!</h1>;

// 위 코드는 다음과 같이 변환됨
const element = React.createElement(
  'h1',
  { className: 'greeting' },
  'Hello, world!'
);

// 결과 객체 (단순화됨)
const element = {
  type: 'h1',
  props: {
    className: 'greeting',
    children: 'Hello, world!'
  },
  key: null
};
```

JSX는 `createElement` 메서드를 호출하기 위한 문법이며, 이 메서드는 ReactElement 객체를 반환합니다. 리액트는 이 객체들을 가상 DOM에 저장하고 실제 DOM을 구성하는 데 사용합니다.

#### JSX.Element

```typescript
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
  }
}
```

**JSX.Element는 ReactElement를 확장**한 타입으로:
- props와 type이 `any`로 고정됨
- 전역 네임스페이스에 정의되어 외부 라이브러리에서 재정의 가능
- JSX 문법 사용 시의 표준 반환 타입

#### ReactNode

```typescript
type ReactNode =
  | ReactElement      // JSX 요소
  | string           // 텍스트
  | number           // 숫자
  | boolean          // 불린
  | null             // null
  | undefined        // undefined
  | ReactFragment    // Fragment
  | ReactPortal;     // Portal
```

**ReactNode는 가장 넓은 범위**의 타입으로, 리액트가 렌더링할 수 있는 모든 것을 포함합니다.

#### 포함 관계 다이어그램

```
ReactNode (가장 넓음)
  ├── ReactElement
  │     └── JSX.Element (props, type이 any)
  ├── string
  ├── number
  ├── boolean
  ├── null
  └── undefined
```

---

### 1.5 실제 사용 예시

#### ReactNode 사용 예시

**다양한 타입의 children을 받아야 할 때:**

```typescript
interface LayoutProps {
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
}

const Layout = ({ children, sidebar }: LayoutProps) => {
  return (
    <div>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
};

// 다양한 타입 전달 가능
<Layout 
  sidebar={<nav>메뉴</nav>}
  children="텍스트도 가능"
/>

<Layout 
  sidebar={null}
  children={123}
/>
```

#### JSX.Element 사용 예시

**JSX 요소만 받고, 해당 요소의 props에 접근해야 할 때:**

```typescript
interface IconProps {
  size: number;
  color: string;
}

const Icon = ({ size, color }: IconProps) => {
  return <svg width={size} height={size} fill={color} />;
};

interface ButtonProps {
  icon: JSX.Element; // JSX 요소만 허용
  label: string;
}

const Button = ({ icon, label }: ButtonProps) => {
  // icon의 props에 접근 가능
  const iconSize = icon.props.size;
  console.log(`아이콘 크기: ${iconSize}px`);
  
  return (
    <button>
      {icon}
      <span>{label}</span>
    </button>
  );
};

// 사용
<Button 
  icon={<Icon size={16} color="blue" />} 
  label="클릭" 
/>
```

#### ReactElement 사용 예시

**특정 컴포넌트의 props 타입을 명시하고 타입 추론을 활용할 때:**

```typescript
interface IconProps {
  size: number;
  color: string;
}

interface ButtonProps {
  // IconProps 타입의 props를 가진 ReactElement만 허용
  icon: React.ReactElement<IconProps>;
  label: string;
}

const Button = ({ icon, label }: ButtonProps) => {
  // IDE에서 icon.props의 타입이 정확히 추론됨
  const iconSize = icon.props.size;    // number 타입
  const iconColor = icon.props.color;  // string 타입
  
  return (
    <button>
      {icon}
      <span>{label}</span>
    </button>
  );
};

// 올바른 사용
<Button 
  icon={<Icon size={20} color="red" />} 
  label="저장" 
/>

// 타입 에러 발생
<Button 
  icon={<div>잘못된 요소</div>} 
  label="저장" 
/>
```

**선택 가이드:**
- **ReactNode**: children처럼 다양한 타입을 받아야 할 때
- **JSX.Element**: JSX 요소만 받되, props 타입은 중요하지 않을 때
- **ReactElement\<T>**: 특정 컴포넌트의 props 타입까지 명시하고 싶을 때

---

### 1.6 HTML 요소 타입 활용하기

HTML 기본 요소를 확장한 컴포넌트를 만들 때, 기존 HTML 속성들을 재사용할 수 있습니다.

```typescript
// 1. DetailedHTMLProps 사용
type NativeButtonProps = React.DetailedHTMLProps
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

interface ButtonProps {
  onClick?: NativeButtonProps['onClick'];
  disabled?: NativeButtonProps['disabled'];
  variant?: 'primary' | 'secondary';
}

// 2. ComponentPropsWithoutRef 사용 (권장)
type NativeButtonType = React.ComponentPropsWithoutRef<'button'>;

interface ButtonProps {
  onClick?: NativeButtonType['onClick'];
  disabled?: NativeButtonType['disabled'];
  variant?: 'primary' | 'secondary';
}

// 3. Pick으로 필요한 속성만 선택
interface ButtonProps 
  extends Pick<NativeButtonType, 'onClick' | 'disabled' | 'type'> {
  variant?: 'primary' | 'secondary';
}
```

#### forwardRef와 함께 사용하기

함수 컴포넌트에서 ref를 전달받으려면 `forwardRef`를 사용해야 합니다:

```typescript
type NativeButtonType = React.ComponentPropsWithoutRef<'button'>;

interface ButtonProps extends NativeButtonType {
  variant?: 'primary' | 'secondary';
}

// forwardRef의 제네릭: <ref 타입, props 타입>
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', children, ...props }, ref) => {
    return (
      <button 
        ref={ref} 
        className={`button-${variant}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

// 사용
const App = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const handleClick = () => {
    buttonRef.current?.focus();
  };
  
  return (
    <>
      <Button ref={buttonRef} onClick={handleClick}>
        클릭하세요
      </Button>
    </>
  );
};
```

**주의사항:**
- 함수 컴포넌트에서는 `ComponentPropsWithoutRef` 사용 (ref 제외)
- forwardRef 사용 시에만 ref를 props로 받을 수 있음
- `DetailedHTMLProps`나 `HTMLProps`는 ref를 포함하므로 주의

---

## 2. 타입스크립트로 Select 컴포넌트 만들기

실제 예제를 통해 JSX에서 TSX로 단계별로 전환해보겠습니다.

### 2.1 JSX로 구현된 Select 컴포넌트

```javascript
const Select = ({ onChange, options, selectedOption }) => {
  const handleChange = (e) => {
    const selected = Object.entries(options).find(
      ([_, value]) => value === e.target.value
    )?.[0];
    onChange?.(selected);
  };

  return (
    <select
      onChange={handleChange}
      value={selectedOption && options[selectedOption]}
    >
      {Object.entries(options).map(([key, value]) => (
        <option key={key} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
};
```

**문제점:**
- 각 prop의 타입이 명확하지 않음
- 잘못된 타입 전달 가능
- IDE의 자동완성 지원 부족

---

### 2.2 Props 인터페이스 적용하기

```typescript
// options의 타입 정의
type Option = Record<string, string>; // { [key: string]: string }

interface SelectProps {
  options: Option;                    // 필수
  selectedOption?: string;            // 선택적
  onChange?: (selected?: string) => void; // 선택적
}

const Select = ({
  options,
  selectedOption,
  onChange
}: SelectProps): JSX.Element => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Object.entries(options).find(
      ([_, value]) => value === e.target.value
    )?.[0];
    onChange?.(selected);
  };

  return (
    <select
      onChange={handleChange}
      value={selectedOption && options[selectedOption]}
    >
      {Object.entries(options).map(([key, value]) => (
        <option key={key} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
};
```

**개선사항:**
- Props 타입이 명확해짐
- 타입 안정성 확보
- IDE 지원 향상

**Record 타입 설명:**

```typescript
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

// 예시
type Option = Record<string, string>;
// = { [key: string]: string }

const options: Option = {
  apple: '사과',
  banana: '바나나'
};
```

---

### 2.3 리액트 이벤트 타입

리액트는 브라우저 네이티브 이벤트를 감싼 **합성 이벤트(SyntheticEvent)**를 사용합니다.

```typescript
// 일반 이벤트 핸들러
const handler1: GlobalEventHandlers['onchange'] = (e) => {
  e.target // EventTarget | null (target이 없을 수 있음)
};

// 리액트 합성 이벤트 핸들러
const handler2: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
  e.target // HTMLSelectElement (타입이 명확함)
  e.target.value // string
};
```

**리액트 이벤트의 특징:**
- 카멜 케이스 표기: `onClick`, `onChange`
- 이벤트 버블링 단계에서 호출
- 브라우저 간 일관된 동작 보장

**주요 이벤트 타입:**

```typescript
// 마우스 이벤트
React.MouseEventHandler<HTMLButtonElement>

// 키보드 이벤트
React.KeyboardEventHandler<HTMLInputElement>

// 폼 이벤트
React.FormEventHandler<HTMLFormElement>

// 변경 이벤트
React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>

// 포커스 이벤트
React.FocusEventHandler<HTMLInputElement>
```

---

### 2.4 훅에 타입 추가하기

```typescript
const fruits = {
  apple: '사과',
  banana: '바나나',
  blueberry: '블루베리'
};

// ❌ 타입 지정 안 함 - 문제 발생 가능
const FruitSelect = () => {
  const [fruit, setFruit] = useState(); // fruit: undefined
  
  // 다른 값도 설정 가능 (타입 안정성 없음)
  setFruit('orange'); // 에러 없음!
  
  return <Select options={fruits} selectedOption={fruit} />;
};

// ✅ 타입 지정 - 타입 안정성 확보
type Fruit = keyof typeof fruits; // 'apple' | 'banana' | 'blueberry'

const FruitSelect = () => {
  const [fruit, setFruit] = useState<Fruit | undefined>();
  
  // fruits에 없는 값 설정 시 에러
  setFruit('orange'); // ❌ 타입 에러!
  setFruit('apple');  // ✅ OK
  
  return (
    <Select 
      options={fruits} 
      selectedOption={fruit}
      onChange={setFruit}
    />
  );
};
```

**keyof typeof 패턴:**

```typescript
const colors = {
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF'
};

type ColorKey = keyof typeof colors; // 'red' | 'green' | 'blue'
type ColorValue = typeof colors[ColorKey]; // '#FF0000' | '#00FF00' | '#0000FF'
```

**useState 타입 지정 원칙:**
- 원시 타입은 자동 추론 가능 (생략 가능)
- 복잡한 타입은 명시적으로 지정
- 초기값이 없으면 `| undefined` 추가

---

### 2.5 제네릭 컴포넌트 만들기

현재 구현의 문제점:

```typescript
type Option = Record<string, string>; // 너무 넓은 타입

const fruits = { apple: '사과', banana: '바나나' };

// ❌ fruits에 없는 값도 허용됨
<Select 
  options={fruits} 
  selectedOption="orange" // 에러 없음!
/>
```

**제네릭을 사용한 해결:**

```typescript
interface SelectProps<OptionType extends Record<string, string>> {
  options: OptionType;
  selectedOption?: keyof OptionType;  // options의 키만 허용
  onChange?: (selected?: keyof OptionType) => void;
}

// 제네릭 함수 컴포넌트
const Select = <OptionType extends Record<string, string>>({
  options,
  selectedOption,
  onChange
}: SelectProps<OptionType>) => {
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const selected = Object.entries(options).find(
      ([_, value]) => value === e.target.value
    )?.[0] as keyof OptionType | undefined;
    
    onChange?.(selected);
  };

  return (
    <select
      onChange={handleChange}
      value={selectedOption && options[selectedOption]}
    >
      {Object.entries(options).map(([key, value]) => (
        <option key={key} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
};

// 사용
const fruits = { apple: '사과', banana: '바나나', blueberry: '블루베리' };

const FruitSelect = () => {
  const [fruit, setFruit] = useState<keyof typeof fruits>();
  
  return (
    <Select
      options={fruits}
      selectedOption={fruit}
      onChange={setFruit}
      // selectedOption="orange" // ❌ 타입 에러!
    />
  );
};
```

**제네릭 컴포넌트의 장점:**
- 전달된 options에 맞춰 타입 자동 추론
- selectedOption과 onChange의 타입이 options에 연동됨
- 타입 안정성 극대화

---

### 2.6 HTML 속성과 스타일 추가하기

```typescript
// 1. React의 HTML 속성 타입 활용
type ReactSelectProps = React.ComponentPropsWithoutRef<'select'>;

// 2. Pick으로 필요한 속성만 선택
interface SelectProps<OptionType extends Record<string, string>>
  extends Pick<ReactSelectProps, 'id' | 'className' | 'disabled'> {
  options: OptionType;
  selectedOption?: keyof OptionType;
  onChange?: (selected?: keyof OptionType) => void;
}
```

**styled-components와 함께 사용:**

```typescript
// 테마 정의
const theme = {
  fontSize: {
    small: '14px',
    default: '16px',
    large: '18px'
  },
  color: {
    primary: '#007bff',
    secondary: '#6c757d',
    black: '#000000'
  }
};

type Theme = typeof theme;
type FontSize = keyof Theme['fontSize'];
type Color = keyof Theme['color'];

// 스타일 Props
interface SelectStyleProps {
  fontSize?: FontSize;
  color?: Color;
}

// styled-components 컴포넌트
const StyledSelect = styled.select<SelectStyleProps>`
  font-size: ${({ fontSize = 'default' }) => theme.fontSize[fontSize]};
  color: ${({ color = 'black' }) => theme.color[color]};
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

// 최종 Props
interface SelectProps<OptionType extends Record<string, string>>
  extends Pick<ReactSelectProps, 'id' | 'className'>,
          Partial<SelectStyleProps> {
  options: OptionType;
  selectedOption?: keyof OptionType;
  onChange?: (selected?: keyof OptionType) => void;
}

// 컴포넌트 구현
const Select = <OptionType extends Record<string, string>>({
  options,
  selectedOption,
  onChange,
  fontSize = 'default',
  color = 'black',
  ...props
}: SelectProps<OptionType>) => {
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const selected = Object.entries(options).find(
      ([_, value]) => value === e.target.value
    )?.[0] as keyof OptionType | undefined;
    
    onChange?.(selected);
  };

  return (
    <StyledSelect
      onChange={handleChange}
      value={selectedOption && options[selectedOption]}
      fontSize={fontSize}
      color={color}
      {...props}
    >
      {Object.entries(options).map(([key, value]) => (
        <option key={key} value={value}>
          {value}
        </option>
      ))}
    </StyledSelect>
  );
};
```

---

### 2.7 공변성과 반공변성

타입의 할당 가능성을 이해하는 것은 안전한 타입 설계에 중요합니다.

#### 공변성 (Covariance)

일반적인 타입은 공변성을 가집니다. 즉, 좁은 타입을 넓은 타입에 할당할 수 있습니다.

```typescript
interface User {
  id: string;
  name: string;
}

interface Member extends User {
  nickname: string;
  level: number;
}

// Member는 User의 서브타입 (Member ⊂ User)
let user: User;
let member: Member = {
  id: '1',
  name: '홍길동',
  nickname: 'hong',
  level: 5
};

user = member; // ✅ OK - 공변성
// member = user; // ❌ Error
```

#### 반공변성 (Contravariance)

함수 타입은 매개변수에 대해 반공변성을 가집니다.

```typescript
type PrintUser = (user: User) => void;
type PrintMember = (member: Member) => void;

let printUser: PrintUser = (user) => {
  console.log(user.id, user.name);
};

let printMember: PrintMember = (member) => {
  console.log(member.id, member.name, member.nickname, member.level);
};

// 함수는 반공변적
// printUser = printMember; // ❌ Error
printMember = printUser; // ✅ OK
```

**왜 이렇게 동작할까?**

```typescript
// 만약 printUser = printMember가 허용된다면?
printUser = printMember; // 가정

const regularUser: User = { id: '1', name: '김철수' };
printUser(regularUser); 
// printMember가 호출되면서 member.nickname에 접근 시도
// 하지만 regularUser에는 nickname이 없음 → 런타임 에러!
```

#### 함수 타입 정의 방법에 따른 차이

```typescript
interface Props<T extends string> {
  // 화살표 함수 표현식 - 반공변적 (안전)
  onChangeA?: (selected: T) => void;
  
  // 함수 선언 - 이변적 (bivariant, 덜 안전)
  onChangeB?(selected: T): void;
}

type Fruit = 'apple' | 'banana' | 'blueberry';

const fruits = { apple: '사과', banana: '바나나', blueberry: '블루베리' };

const Component = () => {
  // 더 좁은 타입의 함수
  const handleApple = (fruit: 'apple') => {
    console.log('사과 선택:', fruit);
  };
  
  return (
    <Select<typeof fruits>
      options={fruits}
      // onChangeA={handleApple} // ❌ 타입 에러 (반공변적)
      onChangeB={handleApple}  // ⚠️  허용됨 (이변적)
    />
  );
};
```

**권장사항:**
- 화살표 함수 표현식 사용 (반공변적)
- 타입 안정성을 위해 strict 모드 활성화
- 함수 Props는 필요한 경우에만 제네릭 사용

---

## 3. 완성된 Select 컴포넌트

모든 개념을 적용한 최종 코드입니다:

```typescript
// theme.ts
export const theme = {
  fontSize: {
    small: '14px',
    default: '16px',
    large: '18px'
  },
  color: {
    primary: '#007bff',
    secondary: '#6c757d',
    black: '#000000',
    white: '#ffffff'
  }
} as const;

type Theme = typeof theme;
export type FontSize = keyof Theme['fontSize'];
export type Color = keyof Theme['color'];

// Select.tsx
import styled from 'styled-components';
import { theme, FontSize, Color } from './theme';

// Styled Component
interface StyledSelectProps {
  fontSize: FontSize;
  color: Color;
}

const StyledSelect = styled.select<StyledSelectProps>`
  font-size: ${({ fontSize }) => theme.fontSize[fontSize]};
  color: ${({ color }) => theme.color[color]};
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${theme.color.primary};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Props 타입
type ReactSelectProps = React.ComponentPropsWithoutRef<'select'>;

interface SelectProps<OptionType extends Record<string, string>>
  extends Pick<ReactSelectProps, 'id' | 'className' | 'disabled'>,
          Partial<StyledSelectProps> {
  options: OptionType;
  selectedOption?: keyof OptionType;
  onChange?: (selected?: keyof OptionType) => void;
}

// 컴포넌트
export const Select = <OptionType extends Record<string, string>>({
  options,
  selectedOption,
  onChange,
  fontSize = 'default',
  color = 'black',
  ...restProps
}: SelectProps<OptionType>) => {
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const selected = Object.entries(options).find(
      ([_, value]) => value === e.target.value
    )?.[0] as keyof OptionType | undefined;
    
    onChange?.(selected);
  };

  return (
    <StyledSelect
      onChange={handleChange}
      value={selectedOption ? options[selectedOption] : ''}
      fontSize={fontSize}
      color={color}
      {...restProps}
    >
      <option value="">선택하세요</option>
      {Object.entries(options).map(([key, value]) => (
        <option key={key} value={value}>
          {value}
        </option>
      ))}
    </StyledSelect>
  );
};

// FruitSelect.tsx
const fruits = {
  apple: '사과',
  banana: '바나나',
  blueberry: '블루베리',
  orange: '오렌지'
} as const;

type Fruit = keyof typeof fruits;

export const FruitSelect = () => {
  const [fruit, setFruit] = useState<Fruit>();

  return (
    <div>
      <h2>과일을 선택하세요</h2>
      <Select
        options={fruits}
        selectedOption={fruit}
        onChange={setFruit}
        fontSize="large"
        color="primary"
      />
      {fruit && <p>선택한 과일: {fruits[fruit]}</p>}
    </div>
  );
};
```

---

## 4. 정리 및 Best Practices

### 타입스크립트로 리액트 컴포넌트를 만들 때 체크리스트

1. **Props 타입 명시**
   - interface 또는 type으로 명확하게 정의
   - 필수/선택적 속성 구분
   - JSDoc 주석으로 설명 추가

2. **이벤트 핸들러 타입**
   - React 합성 이벤트 타입 사용
   - 올바른 HTML 엘리먼트 타입 지정

3. **제네릭 활용**
   - 재사용 가능한 컴포넌트는 제네릭으로
   - 타입 제약 조건 명시 (`extends`)

4. **HTML 속성 확장**
   - `ComponentPropsWithoutRef` 사용
   - forwardRef와 함께 ref 전달

5. **반환 타입**
   - 명시적으로 지정하거나 추론 활용
   - children: `ReactNode`
   - 렌더 함수: `JSX.Element` 또는 `ReactElement`

6. **상태 관리**
   - useState에 명확한 타입 지정
   - 초기값이 없으면 `| undefined` 추가

### 현대적인 React + TypeScript 패턴

```typescript
// ✅ 현대적인 패턴
const Component = ({ prop }: Props) => {
  // 함수 컴포넌트 + Hooks
  const [state, setState] = useState<Type>();
  
  return <div>{/* JSX */}</div>;
};

// forwardRef가 필요한 경우
const Component = forwardRef<HTMLElement, Props>(
  ({ prop }, ref) => {
    return <div ref={ref}>{/* JSX */}</div>;
  }
);
```
