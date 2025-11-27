# API 에러 핸들링

**에러 핸들링을 하는 이유**

1. 에러 상황에 대비해서 명시적인 코드 작성 시 유지보수가 용이.
2. 사용자에게 구체적인 에러 상황 전달 가능.

## ****핸들링 방법

#### 타입 가드 활용

Axios 에서는 Axios 에러에 대해 `isAxiosError` 라는 타입 가드를 제공.
직접 사용 가능하나, 서버에러의 명확함과 서버 에러 응답 객체도 구체적으로 정의함으로써 객체의 속성 파악도 가능.

```ts
interface ErrorResponse {
    status： string;
    serverDateTime： string;
    errorCode： string;
    errorMessage： string;
}
```

서버 에러 응답 구조 명시 및 인터페이스를 사용하여 타입의 안정성 확보.

```ts
function isServerError(error: unknown)： error is AxiosError<ErrorResponse> {
    return axios.isAxiosError(error);
}

```

`error is AxiosError<ErrorResponse>` 부분이 타입 가드의 핵심.
: `is` 키워드는 "이 함수가 true를 반환하면, error는 AxiosError<ErrorResponse> 타입이다"라고 TypeScript에게 알려주는 역할

```ts
const onClickDeleteHistoryButton = async (id： string) => {
    try {
        await axios .post ("https：//...",{ id });
        alert("주문 내역이 삭제되었습니다.");
    } catch (error： unknown) {
        if (isServerError(e) && e.response && e.response.data.errorMessage) {
            // 서버 에러일 때의 처리임을 명시적으로 알 수 있다
            setErrorMessage(e.response.data.errorMessage);
            return;
        }
        setErrorMessage("일시적인 에러가 발생했습니다. 잠시 후 다시 시도해주세요");
    }
}；
```

위 코드에서 `isServerError(e)`를 통과한다면, 그 이후 블록에서는 타입스크립트가 `e`를 `AxiosError<ErrorResponse>`타입으로 인식하여 `e.response.data.errorMessage`에 안전하게 접근 가능.
타입 가드가 없었다면 타입스크립트 에러가 발생했을 것.

#### 서브클래싱

기존(상위 또는 부모) 클래스를 확장하여 새로운(하위 또는 자식) 클래스를 만드는 과정
(_Javascript_ 의 _Error_ 클래스를 상속 받아서 커스텀 에러 클래스를 만드는 방법)

```ts
// 기본 개념
class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomError";
  }
}
```

```ts

// 1. 여러 종류의 커스텀 에러 클래스 정의
class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

// 2. 에러를 던질 때 사용
function processOrder(orderId: string) {
  if (!orderId) {
    throw new OrderError("주문 ID가 없습니다");
  }
  
  // 주문 처리 로직...
  if (paymentFailed) {
    throw new PaymentError("결제에 실패했습니다");
  }
}

// 3. 에러를 잡을 때 타입별로 구분 처리
try {
  processOrder(orderId);
} catch (error) {
  if (error instanceof OrderError) {
    // 주문 관련 에러 처리
    alert("주문 정보를 확인해주세요");
  } else if (error instanceof PaymentError) {
    // 결제 관련 에러 처리
    alert("결제 수단을 확인해주세요");
  } else if (error instanceof NetworkError) {
    // 네트워크 에러 처리
    alert("네트워크 연결을 확인해주세요");
  } else {
    // 예상하지 못한 에러
    alert("알 수 없는 에러가 발생했습니다");
  }
}

```

위와 같이 사용 가능하며 장점으로는

1. 에러 종류를 명확히 구분 가능(`instanceof` 로 어떤 종류인지 파악.)
2. 에러별 맞춤 처리
3. 커스텀 속성 추가
   ```ts
   class ApiError extends Error {
   statusCode: number;
   endpoint: string;

   constructor(message: string, statusCode: number, endpoint: string) {
       super(message);
       this.name = "ApiError";
       this.statusCode = statusCode;
       this.endpoint = endpoint;
   }
   }

   // 에러메세지, 상태코드, 엔트포인트 같은 추가 정보도 함께 전달 가능.
   throw new ApiError("API 호출 실패", 500, "/api/orders");
   ```

#### 인터셉터를 활용

Axios 같은 페칭 라이브러리에서 제공하는 기능인 인터셉터를 활용하여 HTTP에러에 일관된 로직 적용 가능.

#### 에러 바운더리를 활용

**에러 바운더리**: 리액트 컴포넌트 트리에서 공통으로 에러를 처리하는 컴포넌트.

하위에서 발생한 에러를 캐치하여, 가장 가까운 부모 에러 바운더리에서 처리.
에러가 발생한 컴포넌트 대신에 에러를 처리 또는 예상치 못한 에러를 공통으로 처리할 때 사용.

> 렌더링 때 발생한 에러를 자동으로 에러 바운더리가 잡아줌. 하위에서 따로 try-catch를 안 해도 되는 장점.
> 왜냐? React가 직접 실행하는 코드이므로 React가 에러를 캐치!
> 하지만 이벤트 핸들러나 비동기 코드의 에러는 각 컴포넌트에서 직접 처리.

```ts

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  // 에러가 발생하면 이 메서드가 호출됨
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  // 에러 로깅 등의 부수 효과 처리
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('에러 발생:', error);
    console.error('에러 정보:', errorInfo);
    // 에러 로깅 서비스로 전송할 수도 있음
  }

  render() {
    if (this.state.hasError) {
      // 에러 발생 시 보여줄 UI
      return (
        <div>
          <h1>문제가 발생했습니다</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

```

```tsx
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}

// MyComponent에서 에러가 발생하면
function MyComponent() {
  const [data, setData] = useState(null);
  
  // 이런 에러가 발생하면 ErrorBoundary가 잡아냄
  return <div>{data.name}</div>; // data가 null이면 에러 발생
}

```

# API 모킹

**모킹**: 가짜 모듈을 활용하는 것.

_API 모킹_ 은 실제 서버 API 를 호출하는 대신 미리 정의된 가짜 응답을 반환하도록 만드는 것.

모킹을 사용하는 이유

1. 백엔드 API 준비가 안 됐을 때
2. 테스트 환경 구축
3. 개발 속도 향상
4. 특정 상황 재현

* JSON 파일 불러오기

간단한 조회만 필요한 경우 *.json 파일 생성 또는 js 파일 안에 JSON 형식의 정보를 저장하고 export 해주는 방식 사용. get 요청에 파일 경로 삽입 시 조회 응답으로 원하는 값 받음.

환경 설정 필요 없고 초기 단계에서 빠르게 목업(시각적 프로토타입)을 구축할 때 유용.

```ts

// mock/service.ts
const SERVICES: Service[] = [
    {
        id： 0,
        name： "배달의민족",
    },
    {
        id： 1,
        name： "만화경",
    },
]；

export default SERVICES;
// api
const getServices = ApiRequester.get("/mock/service.ts");

```

* API 요청 핸들러에 분기 추가 & 목업 사용 여부 제어하기

특정 플래그(보통 환경변수나 설정값)를 기반으로 "이번에는 목업 데이터를 쓸까,
실제 API를 호출할까"를 분기 처리하는 것.
각 API 요청 함수마다 분기 로직을 추가해야 하는 번거로움이 존재.

```ts
// api.ts
// 목업 사용 여부 제어하기 ➡️ 환경변수로 목업을 사용할지 말지 제어
const IS_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

// 목업 함수
const mockGetUserList = () => {
  return Promise.resolve({
    data: [
      { id: 1, name: '홍길동' },
      { id: 2, name: '김철수' }
    ]
  });
};

// 실제 API 호출 함수
const realGetUserList = () => {
  return axios.get('/api/users');
};

// API 요청 핸들러에 분기 추가 ➡️ 조건에 따라 다른 함수를 내보냄
export const getUserList = IS_MOCK ? mockGetUserList : realGetUserList;
```

```ts
import { getUserList } from './api';

// 사용하는 쪽에서는 목업인지 실제인지 신경쓰지 않음
const users = await getUserList();

```
