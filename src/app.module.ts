import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './company/company.module';
import { SubcontractorModule } from './subcontractor/subcontractor.module';
import { AuthModule } from './auth/auth.module';
import { JobModule } from './job/job.module';
import { Logger } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/traids', {
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          Logger.log('MongoDB connected successfully', 'MongooseModule');
        });
        connection.on('disconnected', () => {
          Logger.warn('MongoDB disconnected', 'MongooseModule');
        });
        return connection;
      },
    }),
    CompanyModule,
    SubcontractorModule,
    AuthModule,
    JobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
