export class CreateUserDto {
  constructor(
    public email: string,
    public firstName: string,
    public lastName?: string,
  ) {}
}