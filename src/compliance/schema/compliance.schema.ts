import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ComplianceDocument = HydratedDocument<Compliance>;

@Schema({ timestamps: true })
export class Compliance {
    @Prop({ required: true })
    name: string;

    @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
    project: Types.ObjectId;

    @Prop({ type: [String], default: [] })
    RAMS: string[];

    @Prop({ type: [String], default: [] })
    permits: string[];

    @Prop({ type: [String], default: [] })
    reports: string[];

    @Prop({ type: [String], default: [] })
    incidents: string[];

    @Prop({ type: [String], default: [] })
    drawings: string[];
}

export const ComplianceSchema = SchemaFactory.createForClass(Compliance);
