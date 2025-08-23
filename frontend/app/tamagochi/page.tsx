'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";


export default function Tamagochi() {
    let eating = false;
    const [displayState, setDisplayState] = useState({ x: 100, y: 400, lookRight: false });


    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayState(prev => {
                let x = (prev.x + ((Math.random() - 0.5) * 100)) % 180;
                let y = (prev.y + ((Math.random() - 0.5) * 100)) % 500;
                let lookRight = prev.x > x;
                return { x, y, lookRight };
            });
        }, 2500);

        // Clean up on unmount
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="h-full bg-[url('/images/TamagochiBackground.png')] bg-cover bg-center">
            <div className="w-[25dvh] h-[25dvh]">
                <TamagochiSVG flipped={displayState.lookRight} x={displayState.x} y={displayState.y} eating={eating}></TamagochiSVG>
            </div>
        </Card>
    )
}

export function TamagochiSVG(props: { flipped: boolean, x: Number, y: Number, eating: boolean }) {
    let fullClassName = "relative transition-all duration-500 w-fill h-fill"
    let source = "/tamagochi.svg"

    if (props.eating) {
        source = "/tamagochiEating.svg"
    }

    if (props.flipped) {
        fullClassName += " -scale-x-100"
    }

    return (<img
        src={source}
        style={{ left: `${props.x}px`, top: `${props.y}px` }}
        className={fullClassName}>

    </img>)
}