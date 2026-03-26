import { ParticleTextEffect } from "@/components/ui/particle-text-effect";
import { InfiniteGridBackground } from "@/components/ui/the-infinite-grid";

export default function bg() {
    return (
        <ParticleTextEffect />
        // <InfiniteGridBackground>
        //     <div className="flex items-center justify-center h-full">
        //         <div className="text-center">
        //             <h1 className="text-4xl font-bold">Content inside the grid</h1>
        //             <p className="text-muted-foreground">Move your mouse to see the magic</p>
        //         </div>
        //     </div>
        // </InfiniteGridBackground>
    );
}
