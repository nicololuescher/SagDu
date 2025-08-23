'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import { useEffect, useState, useRef } from 'react';
import { Apple, Banana, Cookie, CupSoda, Drumstick } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/selectCookie';
import { motion, useAnimation } from 'framer-motion';
import { SnackIcon } from '@/components/SnackIcon';

export default function Tamagochi() {
  const [displayState, setDisplayState] = useState({
    x: 100,
    y: 400,
    lookRight: false,
    eating: false,
  });
  const [selectedAction, setSelectedAction] = useState<string>('cookie');
  const cardRef = useRef<HTMLDivElement>(null);

  const [spawnedItems, setSpawnedItems] = useState<
    { id: number; x: number; y: number; dx: number; dy: number; type: string }[]
  >([]);
  const nextId = useRef(0);

  //Move SagDuck in random directions
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayState((prev) => {
        let x = prev.x + (Math.random() - 0.5) * 100;
        x = Math.max(0, x);
        x = Math.min(180, x);
        let y = prev.y + (Math.random() - 0.5) * 100;
        y = Math.max(250, y);
        y = Math.min(480, y);
        let lookRight = prev.x > x;
        let eating = prev.eating;
        return { x, y, lookRight, eating };
      });
    }, 2500);

    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);

  //Spawn a cookie on the clicked position
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    //Set eating flag temporarily to true to swap out SagDuck with its eating SVG
    setDisplayState((prev) => {
      prev.eating = true;
      return prev;
    });
    setTimeout(() => {
      setDisplayState((prev) => {
        prev.eating = false;
        return prev;
      });
    }, 1000);

    //Click positions
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const directions = [
      { dx: -30, dy: -30 },
      { dx: 30, dy: -30 },
      { dx: -30, dy: 30 },
      { dx: 30, dy: 30 },
      { dx: 0, dy: -50 },
    ];

    setSpawnedItems((prev) => [
      ...prev,
      ...directions.map((dir) => ({
        id: nextId.current++,
        x: x - 10,
        y: y - 30,
        type: selectedAction,
        dx: dir.dx,
        dy: dir.dy,
      })),
    ]);
  };

  //Cleanup spawned objects that were created on click
  useEffect(() => {
    const timers = spawnedItems.map((item) =>
      setTimeout(() => {
        setSpawnedItems((prev) => prev.filter((i) => i.id !== item.id));
      }, 1500)
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [spawnedItems]);

  return (
    <div className="relative h-full">
      <Card
        className="relative h-full bg-[url('/images/TamagochiBackground.png')] bg-cover bg-center"
        onClick={handleClick}
        ref={cardRef}
      >
        <div className="w-[25dvh] h-[25dvh]">
          <TamagochiSVG
            flipped={displayState.lookRight}
            x={displayState.x}
            y={displayState.y}
            eating={displayState.eating}
          ></TamagochiSVG>
        </div>
        {spawnedItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ x: item.x, y: item.y, opacity: 1 }}
            animate={{ x: item.x + item.dx, y: item.y + item.dy, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute pointer-events-none w-6 h-6"
          >
            <SnackIcon itemValue={item.type} />
          </motion.div>
        ))}
        <CardAction className="absolute bottom-2 right-2">
          <div className="bg-black rounded-full w-[8dvh] h-[8dvh] flex justify-center items-center">
            <Select
              defaultValue="cookie"
              value={selectedAction}
              onValueChange={setSelectedAction}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Snacks</SelectLabel>
                  <SelectItem value="cookie">
                    <SnackIcon itemValue="cookie" />
                  </SelectItem>
                  <SelectItem value="apple">
                    <SnackIcon itemValue="apple" />
                  </SelectItem>
                  <SelectItem value="banana">
                    <SnackIcon itemValue="banana" />
                  </SelectItem>
                  <SelectItem value="drumstick">
                    <SnackIcon itemValue="drumstick" />
                  </SelectItem>
                  <SelectItem value="cup-soda">
                    <SnackIcon itemValue="cup-soda" />
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </Card>
    </div>
  );
}

export function TamagochiSVG(props: {
  flipped: boolean;
  x: Number;
  y: Number;
  eating: boolean;
}) {
  let fullClassName = 'relative transition-all duration-500 w-full h-full';
  let source = '/tamagochi.svg';

  if (props.eating) {
    source = '/tamagochiEating.svg';
  }

  if (props.flipped) {
    fullClassName += ' -scale-x-100';
  }

  return (
    <img
      src={source}
      style={{ left: `${props.x}px`, top: `${props.y}px` }}
      className={fullClassName}
    ></img>
  );
}
