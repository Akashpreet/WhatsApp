import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getTask=query({
    args:{},
    handler:async (ctx,args)=>{
        const tasks=await ctx.db.query("tasks").collect()
        return tasks;
    }
})

export const addTask=mutation({
    args:{
        text: v.string()
    },
    handler:async(ctx,args)=>{
        const taksId=await ctx.db.insert("tasks",{text:args.text,complete:false})
        return taksId
    }
})

export const completeTask=mutation({
    args:{
        id: v.id("tasks"),
    },
    handler: async(ctx,args)=>{
        await ctx.db.patch(args.id,{complete:true})
    }
})

export const deleteTask=mutation({
    args:{
        id: v.id("tasks")
    },
    handler:async (ctx,args)=>{
        await ctx.db.delete(args.id)
    }
})