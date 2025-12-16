# JSX에서 TSX로

## React.ReactElement vs JSX.Element vs React.ReactNode

### React.ReactElement

React.ReactElement는 React.createElement의 반환타입이다. 리액트는 실제 DOM이아닌 가상DOM을 기반으로 렌더링하는데 가상DOM의 엘리먼트는 ReactElement 형태로 저장된다.

### JSX.Element

JSX.Element 타입은 리액트의 ReactElement를 확장하고 있는 타입으로, 글로벌네임스페이스에 정의되어 있어 외부 라이브러리에서 컴포넌트 타입을 재정의 할 수 있는 유연성을 제공한다.

### React.ReactNode

React.ReactNode는 단순히 ReactElement 외에도 boolean, string, number 등의 여러 타입을 포함하고 있다.

### 리액트에서 기본 HTML 요소 타입 활용하기

React에서 커스텀 UI 컴포넌트를 만들 때, 기존 HTML 태그가 제공하는 속성들을 그대로 지원하고 싶은 경우가 많다. 예를 들어 HTML의 `<button>` 태그를 감싸 디자인을 입힌 Button 컴포넌트를 만든다고 가정하면, 기본 버튼 속성(onClick, disabled, type 등)을 모두 props로 허용해야 한다.

이때 사용할 수 있는 대표적인 타입이 React.DetailedHTMLProps 와 React.ComponentPropsWithoutRef 계열 타입이다.

#### HTML 속성을 재사용하는 두 가지 방법

```
DetailedHTMLProps 활용
type NativeButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

type ButtonProps = {
  onClick?: NativeButtonProps['onClick'];
};

ComponentPropsWithoutRef 활용
type NativeButtonType = React.ComponentPropsWithoutRef<'button'>;

type ButtonProps = {
  onClick?: NativeButtonType['onClick'];
};
```

이 외에도 HTMLProps, ComponentPropsWithRef 같은 유틸리티 타입들이 있으며, 모두 HTML 요소가 가진 속성을 정확히 반영하기 위해 만들어진 타입들이다.

#### 커스텀 Button 컴포넌트에 HTML 속성 확장하기

HTML에서 `<button>` 요소를 대체하는 컴포넌트를 만든다면 다음과 같이 기본 속성을 모든 props로 받아 전달할 수 있다.

```
type NativeButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

const Button = (props: NativeButtonProps) => {
  return <button {...props}>버튼</button>;
};
```

이렇게 하면 React가 정의한 HTMLButtonElement 속성을 모두 안정적으로 받을 수 있어, `<button>`과 완전히 동일한 API를 제공하는 컴포넌트가 된다.

#### 그런데… ref를 받기 시작하면 문제가 생긴다

HTML 속성은 모두 props로 전달되지만, ref는 React 내부에서 별도로 처리되는 특별한 속성이다.
따라서 props 스프레드({...props}) 안에 ref가 섞여 버리면:

타입이 깨지거나 React 경고가 발생하거나,  
ref 전달이 올바르게 동작하지 않을 수 있다.  
이 때문에 React는 ref 포함 여부에 따라 타입을 분리해두었다.

커스텀 컴포넌트가 ref를 지원해야 한다면, 반드시 ref 포함 타입 또는 forwardRef와 함께 사용해야 한다.

#### 왜 이런 타입들을 복잡하게 사용해야 할까?

이런 타입 시스템을 쓰는 이유를 정리하면 다음과 같다.

1. HTML 요소의 모든 속성을 정확한 타입으로 지원하기 위해

   수많은 HTML 속성을 일일이 타입으로 정의하는 것은 불가능하므로 React 내장 타입을 재사용하는 것이 가장 안전하다.

2. `<button>` 태그와 동일한 역할을 수행하도록 하기 위해

   접근성, 폼 동작, aria 속성 등 button 요소의 기본 기능을 그대로 제공하기 위함이다.

3. ref가 props와 다르게 처리되기 때문

   ref는 React 내부 메커니즘을 거치므로 props 스프레드와 섞이면 오류가 나기 쉽다.  
    그래서 ref 포함 여부에 따라 타입을 구분해둔 것이다.

4. 확장 가능한 UI 컴포넌트를 설계하기 위해

   아래처럼 HTML 속성을 확장+추상화하는 패턴은 UI 라이브러리(MUI, Radix 등)에서도 표준적으로 사용된다.

   ```
   type ButtonProps = ComponentPropsWithoutRef<'button'> & {
   variant?: 'primary' | 'secondary';
   isLoading?: boolean;
   };
   ```

#### 결론

HTML 요소를 감싸 재사용 가능한 UI 컴포넌트를 만들 때,
기존 태그와 동일한 속성을 그대로 제공하면서도 ref까지 안전하게 전달해야 한다.

이를 위해 React는 DetailedHTMLProps, ComponentProps\* 등 다양한 타입 유틸리티를 제공하며, 이 타입들을 사용하는 것이 재사용성과 타입 안정성 측면에서 가장 권장되는 방식이다.

## 타입스크립트로 리액트 컴포넌트 만들기

커스텀 Select 컴포넌트를 JSX로 만들면, 컴포넌트 사용자가 어떤 타입의 props를 넣어야 하는지 알기 어렵다.
이를 해결하기 위해 TSX로 변환하면서 props 타입, 이벤트 타입, 제네릭, 스타일 타입까지 점진적으로 안전하게 만들어보자.

### 기본 JSX 컴포넌트의 문제점

```
const Select = ({ onChange, options, selectedOption }) => {
  const handleChange = (e) => {
    const selected = Object.entries(options).find(
      ([, value]) => value === e.target.value
    )?.[0];
    onChange?.(selected);
  };

  return (
    <select onChange={handleChange} value={options[selectedOption]}>
      {Object.entries(options).map(([key, value]) => (
        <option key={key} value={value}>{value}</option>
      ))}
    </select>
  );
};
```

#### 문제점

- props 타입이 명확하지 않다
- options 구조를 잘못 넣어도 런타임에서야 에러가 난다
- onChange 호출 시 어떤 타입의 값이 넘어오는지 알 수 없다
- selectedOption이 options에 없는 값을 가질 수 있다  
  → 타입스크립트 적용이 필요하다.

### 기본 props 타입 정의하기

```
type Option = Record<string, string>;

interface SelectProps {
  options: Option;
  selectedOption?: string;
  onChange?: (selected?: string) => void;
}
```

#### 핵심

```
Record<string, string> = { [key: string]: string } (모든 key, value가 string)
```

하지만 key가 너무 넓게 허용되므로 잘못된 값도 들어올 수 있음!!!

### 리액트 이벤트 타입 적용하기

JS에서 e.target.value는 문제 없지만 TS에서는 이벤트 객체가 필요하다.

```
const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
  const selected = Object.entries(options).find(
    ([, value]) => value === e.target.value
  )?.[0];
  onChange?.(selected);
};
```

#### 핵심

React는 브라우저 이벤트와 다른 **합성 이벤트(SyntheticEvent)**를 사용한다

DOM 이벤트 타입 대신 React 타입을 써야 안전하다

### useState 타입을 안전하게 만들기

```
const fruits = {
  apple: "사과",
  banana: "바나나",
  blueberry: "블루베리",
};

type Fruit = keyof typeof fruits;
// 'apple' | 'banana' | 'blueberry'

const [fruit, changeFruit] = useState<Fruit | undefined>();
```

#### 이유

단순 string을 쓰면 "orange" 같은 값도 들어올 수 있음

keyof typeof fruits 로 가능한 옵션들을 자동으로 타입화한다

### Select 컴포넌트에 제네릭 적용하기 (중요)

앞선 SelectProps는 selectedOption이 string이라 너무 넓다.
옵션의 key 값에 맞춰 타입을 자동으로 좁혀야 한다.

```
interface SelectProps<OptionType extends Record<string, string>> {
  options: OptionType;
  selectedOption?: keyof OptionType;
  onChange?: (selected?: keyof OptionType) => void;
}

const Select = <OptionType extends Record<string, string>>(
  props: SelectProps<OptionType>
) => { /* ... */ };
```

#### 효과

selectedOption은 반드시 options의 key 중 하나만 가능

onChange도 동일한 타입을 강제

잘못된 값 전달 시 컴파일 단계에서 바로 잡힌다

### HTML select 속성 타입 가져오기

리액트 컴포넌트는 HTML 속성(id, className, disabled 등)도 전달받을 수 있으므로 타입 확장을 해주자.

```
type ReactSelectProps = React.ComponentPropsWithoutRef<'select'>;

interface SelectProps<OptionType extends Record<string, string>> {
  id?: ReactSelectProps['id'];
  className?: ReactSelectProps['className'];
  // ...
}
```

또는 Pick으로 원하는 것만 선택 가능.

### styled-components 스타일 타입 추가하기

```
interface SelectStyleProps {
  color: Color;
  fontSize: FontSize;
}

const StyledSelect = styled.select<SelectStyleProps>`
  color: ${({ color }) => theme.color[color]};
  font-size: ${({ fontSize }) => theme.fontSize[fontSize]};
`;
```

컴포넌트 props에도 스타일 속성을 병합:

```
interface SelectProps<OptionType extends Record<string, string>>
  extends Partial<SelectStyleProps> {
  // ...
}
```

### 함수 타입의 공변성 / 반공변성 간단 요약

일반 값 타입: 공변성 → 좁은 타입을 넓은 타입에 넣을 수 있음

함수 매개변수 타입: 반공변성 → 좁은 타입의 함수를 넓은 타입에 넣을 수 없음
