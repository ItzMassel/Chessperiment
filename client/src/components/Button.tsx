

export default function Btn() {
    return (
    <section className=''>
    <button type="button" className={`block lg:h-14 lg:w-[412px] p-0 overflow-hidden cursor-pointer
        hover:scale-105 transition-all duration-500 antialiased lg:text-[2.8rem] text-[2rem] leading-[30px] ml-[130px]
        shadow-playShadow active:scale-95`}

    style={{
        backgroundImage:"url('PlayBtn.png')",
        backgroundSize:"cover",
        backgroundRepeat:"no-repeat",
        backgroundPosition:"center",
        fontFamily:'Rockwell',
        color:"#F2FF00",
        textShadow:"-2px 2px 0 #F2FF0080",
        lineHeight:"30px",
        borderRadius:"10px",
        caretColor:"transparent",
        willChange:"transform",
        backfaceVisibility:"hidden",
        transformStyle:"preserve-3d",
    }}>Play</button>
    </section>
    );
}
