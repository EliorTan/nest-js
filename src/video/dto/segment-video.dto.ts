import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SegmentVideoDto {
  @IsString()
  @IsNotEmpty()
  videoFileName: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  segmentDuration?: number;
}
