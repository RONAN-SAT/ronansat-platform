import dbConnect from "@/lib/mongodb";
import Result from "@/lib/models/Result";
import User, { IUser } from "@/lib/models/User";

export const resultService = {
    async createResult(userId: string, data: any) {
        await dbConnect();

        const newResult = await Result.create({
            ...data,
            userId: userId,
        });

        // Update User Stats
        const user = await User.findById(userId);
        if (user) {
            user.testsTaken.push(data.testId);
            if (data.score > user.highestScore) {
                user.highestScore = data.score;
            }
            const now = new Date();
            user.lastTestDate = now;

            // Gather wrong question IDs
            const wrongIds = data.answers
                .filter((ans: any) => !ans.isCorrect)
                .map((ans: any) => ans.questionId);

            user.wrongQuestions.push(...wrongIds);

            await user.save();
        }

        return newResult;
    },

    async getUserResults(userId: string, days?: number) {
        await dbConnect();

        // Ensure Question model is registered before populating
        require("@/lib/models/Question");

        let query: any = { userId: userId };

        if (days) {
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - days);
            query.createdAt = { $gte: dateLimit };
        }

        const results = await Result.find(query)
            .sort({ createdAt: -1 })
            .populate('testId', 'title') 
            .populate({
                path: 'answers.questionId',
                model: 'Question',
                select: 'questionText correctAnswer _id imageUrl'
            });

        return { results };
    }
};
