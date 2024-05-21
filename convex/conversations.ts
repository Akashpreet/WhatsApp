// import { group } from "console";
import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values"
export const createConversation=mutation({
    args:{
        participants:v.array(v.id("users")),
        isGroup:v.boolean(),
        groupName:v.optional(v.string()),
        groupImage:v.optional(v.id("_storage")),
        admin:v.optional(v.id("users")),
    },
    handler:async(ctx,args)=>{
        const identity=await ctx.auth.getUserIdentity()
        if(!identity){
            throw new ConvexError("Unauthorized")
        }
        const existingConversation=await ctx.db
        .query("conversations")
        .filter(q=>
            q.or(
                q.eq(q.field("particapants"),args.participants),
                q.eq(q.field("particapants"),args.participants.reverse())
            )).first()
            if(existingConversation){
                return existingConversation._id
            }
            let groupImage
            if(args.groupImage){
                groupImage=(await ctx.storage.getUrl(args.groupImage)) as string
            }
            const conversationId=await ctx.db.insert("conversations",{
                particapants:args.participants,
                isGroup:args.isGroup,
                groupName:args.groupName,
                groupImage,
                admin:args.admin
            })
            return conversationId
    },
})
export const getMyConversations=query({
    args:{},
    handler:async(ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity()
        if(!identity){
            throw new ConvexError("Unauthorized")
        }
        const user=await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier",q=>q.eq("tokenIdentifier",identity.tokenIdentifier))
        .unique()
        if(!user){
            throw new ConvexError("User not found")
        }
        const conversations=await ctx.db.query("conversations").collect()
        const myConversations=conversations.filter((conversation)=>{
            return conversation.particapants.includes(user._id)
        })
        const conversationWithDetails=await Promise.all(
            myConversations.map(async(conversation)=>{
                let userDetails={}
                if(!conversation.isGroup){
                    const otherUserId=conversation.particapants.find(id=>id!==user._id)
                    const userProfile=await ctx.db
                    .query("users")
                    .filter(q=>q.eq(q.field("_id"),otherUserId))
                    .take(1)
                    userDetails=userProfile[0]
                }
                const lastMessage=await ctx.db
                .query("messages")
                .filter((q)=>q.eq(q.field("conversation"),conversation._id))
                .order("desc")
                .take(1)

                return{
                    ...userDetails,
                    ...conversation,
                    lastMessage:lastMessage[0] || null
                }
            })
        )
        return conversationWithDetails
    }
})

export const kickUser=mutation({
    args:{
        conversationId:v.id("conversations"),
        userId:v.id("users"),
    },
    handler:async(ctx,args)=>{
        const identity=await ctx.auth.getUserIdentity()
        if(!identity){
            throw new ConvexError("Unauthorized")
        }
        const conversation = await ctx.db
        .query("conversations")
        .filter((q)=>q.eq(q.field("_id"),args.conversationId))
        .unique()

        if(!conversation){
            throw new ConvexError("Conversation not found")
        }
        await ctx.db.patch(args.conversationId,{
            particapants:conversation.particapants.filter((id)=>id !==args.userId)
        })
    }
})

export const generateUploadUrl=mutation(async(ctx)=>{
    return await ctx.storage.generateUploadUrl()
})