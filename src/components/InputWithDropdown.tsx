import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
    useDismiss,
    useInteractions,
    useRole,
    FloatingFocusManager,
    FloatingPortal,
    size,
} from "@floating-ui/react";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { normalizeValue } from "@/utils/index";
import { Search } from "lucide-react";

// types
export interface DropdownItem { index: number | string; texto: string };

//TODO documentar um exemplo de uso deste componente

type Props = {
    value?: string | number | null;
    // onChange: (val: number | string) => void;
    onChange: (item: DropdownItem) => void;
    placeholder?: string;
    className?: string;
    processar: (valor: string, signal: AbortSignal) => DropdownItem[] | Promise<DropdownItem[]>;
    config?: { minTextoLength: number }
};


/**
 * Input com dropdown e busca assíncrona usando Floating UI.
 *
 * Permite digitar um texto, buscar itens remotamente
 * e selecionar um item da lista.
 *
 * @example
 * ```tsx
 * const [empresaId, setEmpresaId] = useState(null); 
 * 
 * // Função para buscar empresas (exemplo fictício)
 * const buscarEmpresas = async (valor: string, signal: AbortSignal) => {
 *   const res = await fetch(`/api/empresas?q=${valor}`, { signal });
 *   return res.json();
 * };
 *
 * <InputWithDropdown
 *   value={empresaId}
 *   onChange={(item) => setEmpresaId(item.index)}
 *   processar={buscarEmpresas}
 *   placeholder="Buscar empresa..."
 *   config={{ minTextoLength: 3 }}
 * />
 * ```
 */

export default function InputWithDropdown({
    value,
    onChange,
    placeholder = "Digite para pesquisar...",
    className,
    processar,
    config = { minTextoLength: 3 },
}: Props) {
    const [open, setOpen] = useState(false);
    const [IsLoading, setIsLoading] = useState(false);
    const [itens, setItens] = useState<DropdownItem[]>([]);
    const [search, setSearch] = useState("");
    const [highlight, setHighlight] = useState<number>(-1);
    const controllerRef = useRef<AbortController | null>(null);

    const inputRef = useRef<HTMLInputElement | null>(null);

    // Floating UI setup
    const { refs, floatingStyles, context } = useFloating({
        open,
        onOpenChange: setOpen,
        placement: "bottom-start",
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(6),
            flip(),
            shift({ padding: 8 }),
            // garante que o UL tenha a largura exata do Input
            size({
                apply({ rects, elements }) {
                    elements.floating.style.width = `${rects.reference.width}px`;
                },
            }),
        ],
    });


    const dismiss = useDismiss(context);
    const role = useRole(context, { role: "listbox" });
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, role]);

    const normalize = (s: string) =>
        s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

    const filtered = itens.filter((e) =>
        normalize(e.texto).includes(normalize(search))
    );

    function selectItem(item: DropdownItem) {
        onChange(item);
        setSearch(item.texto);
        setOpen(false);
        setHighlight(-1);
        inputRef.current?.focus();
    }

    const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        
        setSearch(normalizeValue(e.target.value));
        
        if (e.target.value.length < config.minTextoLength) {
            setIsLoading(false);
            setOpen(false);
            return false
        }

        setIsLoading(true);

        // cancela requisição anterior
        controllerRef.current?.abort();

        // cria nova classe AbortController
        const controller = new AbortController();
        controllerRef.current = controller;

        const itens = await processar(e.target.value, controller.signal);
        // await new Promise(resolve => setTimeout(resolve, 5000));

        setIsLoading(false);

        setItens(itens);
        setOpen(true);
        setHighlight(-1);
    }


    // keyboard navigation
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
                if (highlight >= 0 && highlight < filtered.length) {
                    selectItem(filtered[highlight]);
                }
            } else if (e.key === "Escape") {
                setOpen(false);
                setHighlight(-1);
            }
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, filtered, highlight]);

    // scrollIntoView para item destacado (quando navega por teclado)
    useEffect(() => {
        if (!open) return;
        if (highlight < 0) return;
        const root = refs.floating?.current ?? document;
        if (!root) return;
        const el = root.querySelector?.(`li[data-idx="${highlight}"]`) as HTMLElement | null;
        if (el) el.scrollIntoView({ block: "nearest" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [highlight]);

    useEffect(() => {
        if (!open) return;
        const el = inputRef.current;
        if (!el) return;

        // garante que rodará *depois* de outros handlers que alterem seleção/foco
        requestAnimationFrame(() => {
            const pos = el.value.length;
            try {
                el.setSelectionRange(pos, pos);
            } catch {
                // alguns inputs/custom podem falhar; fallback:
                el.selectionStart = el.selectionEnd = pos;
            }
        });
    }, [open]);


    // prevenções para scroll no modal/backdrop: stopPropagation em wheel/touch
    function handleWheel(e: React.WheelEvent) {
        // evita que o scroll da lista "vaze" para o backdrop/dialog
        e.stopPropagation();
        // não chamar preventDefault — queremos que a lista role.
    }
    function handleTouchMove(e: React.TouchEvent) {
        e.stopPropagation();
    }
    function handlePointerDown(e: React.PointerEvent) {
        // não impedir o default porque isso pode atrapalhar o scrollbar/drag.
        // Mas evitar que o evento suba para o backdrop:
        e.stopPropagation();
    }

    return (
        <div className={className}>
            {/* <label className="block text-sm font-medium text-gray-700 mb-1">Labek</label> */}

            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    className="pl-8"
                    ref={(el) => {
                        refs.setReference(el);
                        inputRef.current = el;
                    }}
                    value={search}
                    placeholder={placeholder}
                    // NOTE Aplique o cursor no final ao selecionar o input - por algum motivo o React seleciona todo o texto ao abrir o select
                    onSelect={(e) => {
                        const el = e.target as HTMLInputElement;
                        const pos = el.value.length;
                        // sempre remove seleção e manda o cursor para o final
                        el.setSelectionRange(pos, pos);
                    }}
                    {...getReferenceProps({
                        onChange: handleInput,
                        onFocus: () => {
                            const value = inputRef.current?.value ?? "";
                            if (value.length < config.minTextoLength) {
                                return false;
                            }

                            setOpen(true);
                        },

                    })}
                />

                {IsLoading && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <LoadingSpinner className="h-4 w-4 animate-spin" />
                    </span>)}
            </div>



            {open && (
                <FloatingPortal root={document.body}>
                    <FloatingFocusManager context={context} modal={false}>
                        <ul
                            ref={refs.setFloating}
                            {...getFloatingProps({
                                role: "listbox",
                                // "aria-label": "Lista de empresas",
                                onWheel: handleWheel,
                                onTouchMove: handleTouchMove,
                                onPointerDown: handlePointerDown,
                            })}
                            style={{
                                ...floatingStyles,
                                pointerEvents: "auto",
                                touchAction: "auto",
                                overscrollBehavior: "contain",
                                zIndex: 2147483647,
                                maxHeight: 320,
                                overflow: "auto",
                                borderRadius: 8,
                                boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                                background: "white",
                            }}
                            className="max-h-[320px]"
                        >

                            {filtered.length === 0 ? (
                                <li className="p-2 text-sm text-gray-500">Nenhum resultado encontrado</li>
                            ) : (
                                filtered.map((item, idx) => {
                                    const isHighlighted = idx === highlight;
                                    return (
                                        <li
                                            key={item.index}
                                            data-idx={idx}
                                            // hover
                                            onMouseEnter={() => setHighlight(idx)}
                                            // clique: usar onClick garante que o browser finalize o mouse interactions (scroll + drag funcionam)
                                            onClick={() => selectItem(item)}
                                            // proteção: se algo no modal tentar fechar por pointerdown, evitar propagação
                                            onPointerDown={(e) => {
                                                // NÃO preventDefault aqui — isso pode impedir drag da scrollbar.
                                                e.stopPropagation();
                                            }}
                                            className={`cursor-pointer px-3 py-2 text-sm ${isHighlighted ? "bg-sky-500 text-white" : "text-gray-700"}`}
                                        >
                                            {item.texto}
                                            {String(item.index) === String(value) && (
                                                <span className="ml-2 text-xs text-indigo-500">(selecionado)</span>
                                            )}
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </FloatingFocusManager>
                </FloatingPortal>
            )}
        </div>
    );
}
