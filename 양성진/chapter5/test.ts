type One<T> = {[P in keyof T]:Record<P,T[P]>}[keyof T]

type Temp = {
    card:{card:string;}
  }
  
  type Card = { card: string };
  const one: One<Card> = { card: "hyundai" };