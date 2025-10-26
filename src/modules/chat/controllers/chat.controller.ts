import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseFilters,
  Query,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { ChatService } from 'src/modules/chat/services/chat.service';
import { CreateChannelDto } from 'src/modules/chat/dto/create-channel.dto';
import { DeleteMessageDto } from 'src/modules/chat/dto/delete-messages.dto';
import { SendMessageDto } from 'src/modules/chat/dto/send-message.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('/send-message')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async sendMessage(
    @AuthUser() user: any,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user, sendMessageDto);
  }

  @Get('/fetch-chat-lists')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async fetchUserChannels(@AuthUser() user: any, @Query() query: any) {
    return this.chatService.fetchUserChannels(user._id, query);
  }

  @Get('/service/:id/channels')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async serviceChannels(@AuthUser() user: any, @Param('id') id: any) {
    return this.chatService.fetchServiceChannels(user, id);
  }

  @Get('/user/channels')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async userChannels(@AuthUser() user: any, @Query() query: any) {
    return this.chatService.fetchUserChannels(user, query);
  }

  @Get('/channel-mess')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async channelMess(@AuthUser() user: any, @Query() query: any) {
    // return this.chatService.fetchMessages();
  }

  @Post('/start-channel/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async startChannel(@AuthUser() user: any, @Body() body: CreateChannelDto) {
    return this.chatService.createChannel(user, body);
  }

  @Get('/:channel/fetch-messages')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async fetchChannelMessages(
    @AuthUser() user: any,
    @Param('channel') channel: any,
  ) {
    return this.chatService.fetchChannelMessages(user._id, channel);
  }

  @Get('/last-messages')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async fetchLastMessagesAndUnreadMessageCounts(
    @AuthUser() user: any,
    @Param('channel') channel: any,
  ) {
    return this.chatService.fetchLastMessagesAndUnreadMessageCounts(user);
  }

  @Delete('/messages/delete')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteMessages(@AuthUser() user: any, @Body() body: DeleteMessageDto) {
    return this.chatService.deleteMessages(user, body);
  }
}
