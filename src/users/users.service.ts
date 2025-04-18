/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  findByEmailOrId: any;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // Register a new user
  async registerUser(createUserDto: CreateUserDto): Promise<User> {
    if (!createUserDto.password) {
      throw new Error('Password is required');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Get a user by ID
  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // Update a user's profile
  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
  
    if (!user) {
      throw new NotFoundException("User not found");
    }
  
    // If updating password, hash it before saving
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
  
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);
  
    // Fetch and return updated user
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    if (!updatedUser) {
      throw new NotFoundException("Updated user not found");
    }
    return updatedUser;
  }

  // Delete a user by ID
  async deleteUser(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  // Find a user by email
  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user || undefined; // Convert null to undefined
  }
  
  async findByEmailOrSchoolId(identifier: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
        where: [
            { email: identifier },
            { school_id: identifier }
        ]
    });

    return user ?? undefined; // Convert null to undefined 
  }


  // Find users by role
  async findUsersByRole(role: string): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  // Validate password
  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || !hashedPassword) {
      throw new Error('Password or hashed password is missing');
    }
    return await bcrypt.compare(password, hashedPassword);
  }

  async checkUserExistence(username: string, email: string, school_id: string) {
    const user = await this.userRepository.findOne({
      where: [{ username }, { email }, { school_id }],
    });

    return { exists: !!user };
  }


  // Sign in user (Updated to support Email or School ID)
  async signIn(identifier: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.findByEmailOrSchoolId(identifier);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email, school ID, or password');
    }

    const isPasswordValid = await this.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email, school ID, or password');
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return { user, token };
  }
}
