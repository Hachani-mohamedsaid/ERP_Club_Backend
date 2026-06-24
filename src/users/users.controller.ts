import { Body, Controller, Get, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() _createUserDto: CreateUserDto) {
    return this.usersService.create();
  }

  @MessagePattern('users.find-all')
  findAllMessage() {
    return this.usersService.findAll();
  }

  @MessagePattern('users.create')
  createMessage(@Payload() _createUserDto: CreateUserDto) {
    return this.usersService.create();
  }
}