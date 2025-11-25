# Q1. Axios 인터셉터 사용?

> A. 
> 모든 API 요청/응답에 공통적으로 필요한 로직을 한 곳에서 자동으로 처리하기 위해서
> 요청 전처리 시 자동으로 헤더 추가를 할 수 있고, 여러 서버에서 오는 다양한 형태의 에러를 일관된 형태로 처리 가능

* 흐름

```
API 호출 시작
    ↓
[Request Interceptor] ← 여기서 헤더 자동 추가
    ↓
실제 HTTP 요청
    ↓
서버 응답
    ↓
[Response Interceptor] ← 여기서 에러 통합 처리
    ↓
최종 결과 반환

* 구현 및 사용 예시
```

```ts

// api/authRequester.ts
import axios from 'axios';

// 이 함수를 직접 작성해야 함
function createAuthRequester() {
  // 1. axios 인스턴스 생성
  const instance = axios.create({
    baseURL: 'https://auth.example.com',
    timeout: 5000
  });

  // 2. 요청 인터셉터 설정
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 3. 응답 인터셉터 설정
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const customError = {
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || '에러 발생'
      };
      return Promise.reject(customError);
    }
  );

  // 4. 설정이 완료된 인스턴스 반환
  return instance;
}

// 인스턴스 생성 (앱 실행 시 한 번만)
export const authRequester = createAuthRequester();


// 다른 파일에서
import { authRequester } from '@/api/authRequester';

// 이제 사용하면 인터셉터가 자동 적용됨
authRequester.get('/user/profile');
authRequester.post('/login', { email, password });

```

**빌더 패턴**

* 디자인 패턴 중 하나. 복잡한 객체 생성을 단순화. 객체 생성 과정을 분리하여 객체를 조립하는 방법 제공.
* requester가 다량, 설정 조합이 다양, 대규모 프로젝트일 때 용이

**보일러플레이트 코드**: 기능 사용할 때 반복적으로 사용되는 기본적인 코드.

# Q2. Response 타입은 apiRequest가 모르게 관리 되어야 한다. 그리고 unknown 사용의 이유?????

> A. 
> 프론트엔드가 사용하지 않고 단순 전달만 하는 데이터 → unknown 사용
> 프론트엔드가 내용을 알아서는 안 되는 데이터 → unknown 사용
> 예외적으로 일부 값을 사용해야 한다면 → 필요한 부분만 타입 정의 후 타입 단언
> 하지만 가급적 사용하지 말고 전달만 하는 게 좋다 → API 설계가 변경돼도 영향 없음

`unknown`을 쓰면 문제를 배포 전에 발견할 수 있고, `any`를 쓰면 문제를 사용자가 발견.

```ts
// 예시: 실제로 겪을 수 있는 상황

// any 사용
let data: any = { value: 100 };
console.log(data.value);  // 100 - 잘 작동
data = null;              // 누군가 null로 바꿈
console.log(data.value);  // 💥 런타임 에러!

// unknown 사용
let data: unknown = { value: 100 };
console.log(data.value);  // ❌ 컴파일 에러! 코드 작성 단계에서 막힘

// 올바른 사용
if (data && typeof data === 'object' && 'value' in data) {
  console.log((data as { value: number }).value);  // ✅ 안전
}

```

# Q3. 뷰 모델(View Model)?

> A. 
> API 응답 데이터를 UI에서 사용하기 편한 형태로 변환한 데이터 구조

* 예시

```ts

// 1. API 응답 (서버가 주는 데이터)
interface JobListItemResponse {
  id: number;
  title: string;
  company: string;
  salary: number;
  postedDate: string;  // "2024-01-15T10:30:00Z"
}

// 2. 뷰 모델 (UI에서 실제 사용하는 형태)
interface JobListItemViewModel {
  id: number;
  title: string;
  company: string;
  displaySalary: string;        // "연봉 5000만원" - 보기 좋게 변환
  formattedDate: string;        // "2024년 1월 15일" - 읽기 쉽게 변환
  daysAgo: number;              // 15 - API에 없는 새 필드
}

// 3. 변환 함수
function toViewModel(response: JobListItemResponse): JobListItemViewModel {
  return {
    id: response.id,
    title: response.title,
    company: response.company,
    displaySalary: `연봉 ${response.salary / 10000}만원`,
    formattedDate: formatDate(response.postedDate),
    daysAgo: calculateDaysAgo(response.postedDate)  // API에 없던 값
  };
}

```

장점: API 변경에 강하고, UI 필요 데이터 추가 가능
단점: 코드량 증가, 의사소통 비용, 유지보수 복잡
해결책: 필요한 곳만 사용, 백엔드와 협의, getter 함수 활용

* getter 함수 예시

```ts
// ❌ 뷰 모델에 필드 추가
interface CartViewModel {
    items: CartItem[];
    totalItemCount: number;  // 이게 원본 데이터인지 계산된 건지 모호
}

// ✅ getter 함수로 명확하게
interface Cart {
    items: CartItem[];
    getTotalItemCount(): number;  // 계산하는 거구나!
    getIsEmpty(): boolean;        // 계산하는 거구나!
}

class CartViewModel {
    constructor(private response: CartResponse) {}

    getTotalItemCount(): number {
        return this.response.items.length;  // 계산하는 게 명확
    }
}
```

_Superstruct_: 런타임에 데이터 구조를 검증하는 TypeScript/JavaScript 라이브러리

왜 필요한가?
TypeScript는 컴파일 타임에만 타입을 체크해요. 하지만 실제 런타임에서 API 응답 같은 외부 데이터는 타입이 보장되지 않아요.

```ts
// TypeScript는 이렇게 선언하면 믿어버림
interface User {
  id: number;
  name: string;
  email: string;
}

const response = await fetch('/api/user');
const user: User = await response.json();  // ✅ 컴파일 성공

// 하지만 실제 응답이 이렇다면?
// { id: "123", name: null, age: 25 }
// 런타임에서 💥 에러 발생!

console.log(user.email.toLowerCase());  // Cannot read property 'toLowerCase' of undefined


// Superstruct가 해결하는 방법
import { object, number, string, create } from 'superstruct';

// 1. 스키마 정의
const UserStruct = object({
  id: number(),
  name: string(),
  email: string()
});

// 2. 런타임 검증
const response = await fetch('/api/user');
const data = await response.json();

try {
  const user = create(data, UserStruct);  // 여기서 실제 데이터 검증!
  console.log(user.email.toLowerCase());  // ✅ 안전
} catch (error) {
  // ❌ 검증 실패 시 에러 발생
  console.error('유효하지 않은 데이터:', error.message);
}
```
#### 추천 사용

* API 응답 검증
* 외부에서 받은 JSON 데이터 검증
* localStorage나 외부 설정 파일 검증
* 사용자 입력 데이터 검증

#### 다른 라이브러리와 비교

| 라이브러리 | 특징 |
|----------|------|
| **Superstruct** | 간단하고 가벼움, TypeScript 타입 추론 자동 |
| **Zod** | 더 강력한 기능, 더 복잡한 검증 가능 |
| **Yup** | 주로 폼 검증에 사용, React Hook Form과 잘 맞음 |
| **io-ts** | 함수형 프로그래밍 스타일, 러닝 커브 높음 |

# Q4. 상태 관리 라이브러리 공유 부탁해요.