'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const carbonFootprintFacts = [
    {
      fact: "The average carbon footprint for a person in Qatar is around 40 tons per year, among the highest globally.",
      icon: "🇶🇦"
    },
      {
        fact: "Bhutan is a carbon-negative country, absorbing more CO2 than it produces.",
        icon: "🇧🇹",
      },
    {
      fact: "The average carbon footprint for a person in the United States is 16 tons, one of the highest rates in the world.",
      icon: "🇺🇸"
    },
    {
      fact: "Globally, the average carbon footprint is closer to 4 tons.",
      icon: "🌍"
    },
      {
        fact: "The fashion industry is responsible for about 10% of global carbon emissions.",
        icon: "👕",
      },
    {
      fact: "To avoid a 2℃ rise in global temperatures, the average global carbon footprint per year needs to drop to under 2 tons by 2050.",
      icon: "🌡️"
    },
     {
      fact: "A single Bitcoin transaction can have a carbon footprint comparable to the emissions of a small car driving hundreds of kilometers.",
       icon: "₿"
    },
    {
      fact: "Driving a car for 1,000 miles produces about 0.4 tons of CO2.",
      icon: "🚗"
    },
    {
      fact: "A round-trip flight from New York to London emits about 1.8 tons of CO2 per passenger.",
      icon: "✈️"
    },
    {
      fact: "The production of 1 kilogram of beef releases 60 kilograms of greenhouse gases.",
      icon: "🐄"
    },
    {
      fact: "Using renewable energy sources like solar and wind can significantly reduce your carbon footprint.",
      icon: "☀️"
    },
    {
      fact: "Reducing food waste can lower your carbon footprint, as decomposing food in landfills releases methane.",
      icon: "🍎"
    },
    {
      fact: "Choosing energy-efficient appliances can help reduce your household's carbon emissions.",
      icon: "🏠"
    },
    {
      fact: "Planting trees is an effective way to offset carbon emissions, as trees absorb CO2 from the atmosphere.",
      icon: "🌳"
    },
     {
      fact: "The cement industry is responsible for approximately 8% of the world's carbon dioxide emissions.",
      icon: "🧱",
    },
    {
      fact: "The average carbon footprint of someone in India is about 1.9 tons per year.",
      icon: "🇮🇳",
    },
     {
      fact: "Adopting a vegetarian or vegan diet can significantly reduce your carbon footprint.",
      icon: "🥗",
    },
    {
      fact: "Deforestation is a major contributor to carbon emissions, as trees store carbon dioxide.",
      icon: "🪓"
    },
    {
          fact: "E-waste, if not recycled properly, can release harmful gases contributing to carbon emissions.",
          icon: "📱",
     },
      {
      fact: "The Amazon rainforest, often called the 'lungs of the Earth,' absorbs vast amounts of CO2.",
      icon: "🌳",
     },
      {
        fact: "The per capita carbon footprint in some African countries is less than 1 ton per year.",
        icon: "🌍",
      },
  
  ];
  
  const DOTS_DISPLAYED = 5;
  
  export function CarbonFootprintSlider() {
    const [currentFactIndex, setCurrentFactIndex] = useState(0)
    const [direction, setDirection] = useState(0);
    
  
    useEffect(() => {
      const timer = setInterval(() => {
        setDirection(1)
        goToNext();
      }, 10000) // Change fact every 10 seconds
  
      return () => clearInterval(timer)
    }, []);
  
  
    const goToPrevious = () => {
      setDirection(-1);
      setCurrentFactIndex((prevIndex) =>
        prevIndex === 0 ? carbonFootprintFacts.length - 1 : prevIndex - 1
      );
    };
  
    const goToNext = () => {
      setDirection(1)
      setCurrentFactIndex((prevIndex) => (prevIndex + 1) % carbonFootprintFacts.length)
    }

    const renderDots = () => {
      const dots = [];
      const midIndex = Math.floor(DOTS_DISPLAYED / 2);
      
       for (let i = 0; i < DOTS_DISPLAYED; i++) {
          const dotIndex = currentFactIndex + i - midIndex; // Calculate relative index
           if (dotIndex >= 0 && dotIndex < carbonFootprintFacts.length) {
            const isActive = dotIndex === currentFactIndex;
            const distance = Math.abs(i - midIndex);

            let opacity = 1;
            if (!isActive) {
              opacity = 1 - (distance * 0.3);
              opacity = Math.max(opacity,0.2)
            }

                dots.push(
                  <span
                      key={dotIndex}
                      className={`h-2 w-2 rounded-full transition-opacity duration-200 ${
                      isActive
                        ? 'bg-black dark:bg-gray-400'
                        : 'bg-gray-300 dark:bg-gray-500'
                      }`}
                    style={{ opacity }}
                  />
                );
          }
        }
        return dots
    };
  
  
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Carbon Footprint Facts</h2>
          <div className="relative overflow-hidden h-48">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentFactIndex}
                custom={direction}
                initial={{ opacity: 0, y: direction > 0 ? 50 : -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: direction > 0 ? -50 : 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
              >
                <span className="text-4xl mb-4">{carbonFootprintFacts[currentFactIndex].icon}</span>
                <p className="text-gray-600 dark:text-gray-300 text-lg px-4 leading-relaxed">
                  {carbonFootprintFacts[currentFactIndex].fact}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="flex justify-between bg-gray-100 dark:bg-gray-700 px-6 py-3">
          <button
            onClick={goToPrevious}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200"
            aria-label="Previous fact"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex space-x-2">
              {renderDots()}
          </div>
          <button
            onClick={goToNext}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200"
            aria-label="Next fact"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    )
  }