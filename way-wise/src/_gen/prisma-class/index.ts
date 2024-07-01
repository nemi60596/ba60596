import { Benchmark as _Benchmark } from "./benchmark";
import { BenchmarkResult as _BenchmarkResult } from "./benchmark_result";
import { Iteration as _Iteration } from "./iteration";
import { Note as _Note } from "./note";
import { Password as _Password } from "./password";
import { Reference as _Reference } from "./reference";
import { RouteData as _RouteData } from "./route_data";
import { RoutingEngine as _RoutingEngine } from "./routing_engine";
import { Run as _Run } from "./run";
import { User as _User } from "./user";

export namespace PrismaModel {
  export class User extends _User {}
  export class Password extends _Password {}
  export class Note extends _Note {}
  export class Run extends _Run {}
  export class Iteration extends _Iteration {}
  export class Benchmark extends _Benchmark {}
  export class BenchmarkResult extends _BenchmarkResult {}
  export class Reference extends _Reference {}
  export class RouteData extends _RouteData {}
  export class RoutingEngine extends _RoutingEngine {}

  export const extraModels = [
    User,
    Password,
    Note,
    Run,
    Iteration,
    Benchmark,
    BenchmarkResult,
    Reference,
    RouteData,
    RoutingEngine,
  ];
}
