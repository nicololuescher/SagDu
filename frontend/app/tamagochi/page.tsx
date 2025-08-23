'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Apple, Banana, Cookie, CupSoda, Drumstick } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/selectCookie"


export default function Tamagochi() {
    let eating = false;
    const [displayState, setDisplayState] = useState({ x: 100, y: 400, lookRight: false });

    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayState(prev => {
                let x = (prev.x + ((Math.random() - 0.5) * 100));
                x = Math.max(0, x)
                x = Math.min(180, x)
                let y = (prev.y + ((Math.random() - 0.5) * 100));
                y = Math.max(250, y)
                y = Math.min(480, y)
                let lookRight = prev.x > x;
                return { x, y, lookRight };
            });
        }, 2500);

        // Clean up on unmount
        return () => clearInterval(interval);
    }, []);

    const handleClick = () => {
        
    }

    return (
        <div className="relative h-full">
            <Card className="relative h-full bg-[url('/images/TamagochiBackground.png')] bg-cover bg-center" onClick={handleClick}>
                <div className="w-[25dvh] h-[25dvh]">
                    <TamagochiSVG flipped={displayState.lookRight} x={displayState.x} y={displayState.y} eating={eating}></TamagochiSVG>
                </div>
                <CardAction className="absolute bottom-2 right-2">
                    <div className="bg-black rounded-full w-[8dvh] h-[8dvh] flex justify-center items-center">
                        <Select defaultValue="cookie">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Snacks</SelectLabel>
                                    <SelectItem value="cookie"><Cookie></Cookie></SelectItem>
                                    <SelectItem value="apple"><Apple></Apple></SelectItem>
                                    <SelectItem value="banana"><Banana></Banana></SelectItem>
                                    <SelectItem value="drumstick"><Drumstick></Drumstick></SelectItem>
                                    <SelectItem value="cup-soda"><CupSoda></CupSoda></SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </CardAction>
            </Card>
        </div>
    )
}

export function TamagochiSVG(props: { flipped: boolean, x: Number, y: Number, eating: boolean }) {
    let fullClassName = "relative transition-all duration-500 w-full h-full"
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